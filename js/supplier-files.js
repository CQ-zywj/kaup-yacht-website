/* Local prototype files: blobs in IndexedDB, lightweight references in page data. */
(function (root) {
  let database;
  const urls = new Map();
  const NAME = 'northlink-supplier-files', VERSION = 1, STORES = ['files','finance'];
  function upgrade(db) {
    if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', {keyPath:'id'});
    if (!db.objectStoreNames.contains('finance')) db.createObjectStore('finance', {keyPath:'supplier_id'});
  }
  function request(version) {
    return new Promise((resolve, reject) => {
      const req = version ? indexedDB.open(NAME, version) : indexedDB.open(NAME);
      req.onupgradeneeded = () => upgrade(req.result);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(Error('storage blocked'));
    });
  }
  /* 已存在的同名库若缺表（首轮中断、早期版本残留），固定版本号不会触发
     onupgradeneeded，后续事务全部 NotFoundError。这里检测缺表后升一版补建。 */
  async function connect() {
    let db = await request(VERSION);
    if (STORES.every(name => db.objectStoreNames.contains(name))) return db;
    const next = db.version + 1;
    db.close();
    return request(next);
  }
  function open() {
    if (!database) database = connect().catch(error => { database = null; throw error; });
    return database;
  }
  async function transaction(store, mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      let value;
      const request = action(tx.objectStore(store));
      if (request) request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || Error('storage aborted'));
    });
  }
  /* Validate a whole set without writing anything, so callers can validate every
     file of a form first and only then persist. Prevents a rejected banner from
     leaving an already-saved logo behind as an orphan blob. */
  async function check(files, kind) {
    for (const file of files) {
      const error = SupplierData.fileError(file, kind);
      if (error) throw Error(U.t(error));
      if (file.type.startsWith('image/')) await validateImage(file, kind);
    }
  }
  async function putMany(files, owner, kind) {
    await check(files, kind);
    const rows = files.map(file => ({id:crypto.randomUUID(),owner,name:file.name,type:file.type,size:file.size,blob:file}));
    await transaction('files','readwrite',store => { rows.forEach(row => store.put(row)); });
    return rows.map(({id,name,type,size}) => ({id,name,type,size}));
  }
  async function validateImage(file,kind) {
    if (file.type === 'image/svg+xml') {
      const doc = new DOMParser().parseFromString(await file.text(),'image/svg+xml');
      if (doc.querySelector('parsererror,script,foreignObject,iframe,style,animate,set') ||
        [...doc.querySelectorAll('*')].some(node => [...node.attributes].some(a =>
          /^on/i.test(a.name) || /href$/i.test(a.name) && !a.value.startsWith('#') || /url\s*\(/i.test(a.value)))) throw Error(U.t('unsafeSvg'));
    }
    const src = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = src;
      await image.decode();
      if (kind === 'logo' && (image.naturalWidth < 400 || image.naturalHeight < 400) ||
        kind === 'banner' && (image.naturalWidth !== 1920 || image.naturalHeight !== 480)) throw Error(U.t('fileDimensionsError'));
    } catch (error) { throw Error(error.message === U.t('fileDimensionsError') ? error.message : U.t('fileFormatError')); }
    finally { URL.revokeObjectURL(src); }
  }
  async function url(ref) {
    if (!ref?.id) return '';
    if (!urls.has(ref.id)) {
      const record = await transaction('files','readonly',store => store.get(ref.id));
      if (!record?.blob) return '';
      urls.set(ref.id, URL.createObjectURL(record.blob));
    }
    return urls.get(ref.id);
  }
  async function hydrate(scope = document) {
    for (const image of scope.querySelectorAll('img[data-local-file]')) {
      try {
        const src = await url({id:image.dataset.localFile});
        if (src) image.src = src;
        else image.alt = U.t('localFileMissing');
      } catch { image.alt = U.t('localFileMissing'); }
    }
  }
  async function links(refs, container) {
    container.replaceChildren();
    for (const ref of refs || []) {
      const row = document.createElement('div'); row.className = 'file-item';
      if (typeof ref === 'string') { row.textContent = ref + ' · ' + U.t('localFileMissing'); container.append(row); continue; }
      const src = await url(ref);
      if (!src) { row.textContent = ref.name + ' · ' + U.t('localFileMissing'); container.append(row); continue; }
      const link = document.createElement('a'); link.href = src; link.textContent = ref.name;
      link.target = '_blank'; link.rel = 'noopener'; link.className = 'text-link';
      const download = document.createElement('a'); download.href = src; download.download = ref.name;
      download.textContent = U.t('downloadFile'); download.className = 'text-link';
      row.append(link, document.createTextNode('　'), download);
      if (ref.type.startsWith('image/') && ref.type !== 'image/svg+xml') {
        const image = document.createElement('img'); image.src = src; image.alt = ref.name; image.className = 'certificate-preview'; row.append(image);
      }
      container.append(row);
    }
  }
  root.SupplierFiles = {putMany,check,url,hydrate,links,
    getFinance(id) { return transaction('finance','readonly',store => store.get(id)); },
    saveFinance(row) { return transaction('finance','readwrite',store => store.put(row)); },
  };
})(window);
