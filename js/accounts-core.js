(function (root) {
  const A = {
    permissions(user) {
      const role = ["buyer", "supplier"].includes(user?.role) ? user.role : "guest";
      return { role, buy: role !== "supplier", sell: role === "supplier" };
    },
    assertProfile(p) {
      if (!p || typeof p !== "object" || Array.isArray(p))
        throw Error("invalid profile");
      for (const k of [
        "id",
        "company",
        "company_en",
        "country",
        "contact",
        "city",
        "email",
        "phone",
        "website",
        "business_type",
        "verification_status",
        "name",
        "position",
        "founded",
        "employees",
        "password_hash",
      ])
        if (p[k] !== undefined && typeof p[k] !== "string")
          throw Error("invalid profile field");
      for (const k of ["main_categories", "photos"])
        if (
          p[k] !== undefined &&
          (!Array.isArray(p[k]) || p[k].some((v) => typeof v !== "string"))
        )
          throw Error("invalid profile list");
      if (
        p.intro !== undefined &&
        (!p.intro ||
          typeof p.intro !== "object" ||
          ["zh", "en"].some(
            (k) => p.intro[k] !== undefined && typeof p.intro[k] !== "string",
          ))
      )
        throw Error("invalid introduction");
      if (
        p.certifications !== undefined &&
        (!Array.isArray(p.certifications) ||
          p.certifications.some(
            (c) =>
              !c ||
              typeof c.type !== "string" ||
              typeof c.number !== "string" ||
              (c.image !== undefined && typeof c.image !== "string"),
          ))
      )
        throw Error("invalid certificates");
      return p;
    },
    read(s, k, fallback = null) {
      const v = s.getItem(k);
      if (v === null) return fallback;
      const r = JSON.parse(v);
      if (
        k === "accounts" &&
        (!Array.isArray(r) ||
          r.some(
            (a) =>
              !a ||
              typeof a.id !== "string" ||
              !["buyer", "supplier"].includes(a.role),
          ))
      )
        throw Error("invalid accounts");
      if (
        ["supplier_profile", "current_user"].includes(k) &&
        (!r || typeof r !== "object" || Array.isArray(r))
      )
        throw Error("invalid profile");
      if (["supplier_profile", "current_user"].includes(k))
        this.assertProfile(r);
      if (k === "accounts") r.forEach((a) => this.assertProfile(a));
      return r;
    },
    user(s) {
      return this.read(s, "current_user");
    },
    readProfile(s) {
      const p = this.read(s, "supplier_profile");
      const u = this.user(s);
      if (u?.role === "supplier") {
        const a = this.read(s, "accounts", []).find((a) => a.id === u.id);
        if (p?.id === u.id) return p;
        return a || {};
      }
      if (u?.role === "buyer") return {};
      return p || {};
    },
    resolveProfile(active, snapshot) {
      if (!active.company) return snapshot || active;
      if (
        snapshot?.id === active.id &&
        (snapshot.profile_revision || snapshot.created_at || "") ===
          (active.profile_revision || active.created_at || "")
      )
        return snapshot;
      return active;
    },
    validateProfile(p) {
      const e = {};
      for (const k of ["company", "country", "contact", "email"])
        if (!String(p[k] || "").trim()) e[k] = "required";
      if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
        e.email = "validEmail";
      if (p.website) {
        try {
          const u = new URL(p.website);
          if (!["http:", "https:"].includes(u.protocol))
            e.website = "validWebsite";
        } catch {
          e.website = "validWebsite";
        }
      }
      return e;
    },
    validateRegistration(p) {
      const e = p.role === "supplier" ? this.validateProfile(p) : {};
      for (const k of p.role === "supplier"
        ? [
            "company_en",
            "city",
            "contact",
            "position",
            "phone",
            "email",
            "country",
            "password",
          ]
        : ["name", "company", "email", "country", "password"])
        if (!String(p[k] || "").trim()) e[k] = "required";
      if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
        e.email = "validEmail";
      if (p.password !== p.confirm_password)
        e.confirm_password = "passwordMismatch";
      if (!p.confirm_password) e.confirm_password = "required";
      if (p.role === "supplier" && !p.main_categories?.length)
        e.main_categories = "required";
      if (!p.terms) e.terms = "agreeRequired";
      if (p.role === "supplier" && !p.supplier_terms)
        e.supplier_terms = "agreeRequired";
      return e;
    },
    writeProfile(s, p) {
      this.assertProfile(p);
      this.read(s, "supplier_profile");
      const accounts = this.read(s, "accounts", []);
      const u = this.user(s);
      if (u?.role === "supplier" && p.id && p.id !== u.id)
        throw Error("wrong supplier");
      const id =
        u?.role === "supplier" ? u.id : p.id || "supplier-" + Date.now();
      const { password_hash, password, confirm_password, ...publicProfile } = p;
      const profile = {
        ...publicProfile,
        id,
        verification_status: p.verification_status || "pending",
        profile_revision:
          Date.now() + "-" + Math.random().toString(36).slice(2),
      };
      const i = accounts.findIndex((a) => a.id === id && a.role === "supplier");
      const oldAccounts = s.getItem("accounts");
      try {
        if (i >= 0) {
          accounts[i] = { ...accounts[i], ...profile, role: "supplier" };
          s.setItem("accounts", JSON.stringify(accounts));
        }
        s.setItem("supplier_profile", JSON.stringify(profile));
      } catch (error) {
        try {
          oldAccounts === null
            ? s.removeItem("accounts")
            : s.setItem("accounts", oldAccounts);
        } catch {}
        throw error;
      }
      return profile;
    },
    supplier(p) {
      return {
        id: p.id,
        name: { zh: p.company || "", en: p.company_en || p.company || "" },
        country: p.country || "",
        verified: p.verification_status === "verified",
        profile: { ...p, password_hash: undefined },
        products_count: 0,
      };
    },
    safeReturn(v) {
      if (!v || !/^\w[\w-]*\.html(?:\?[^#]*)?$/.test(v) || /[:\\]/.test(v))
        return "index.html";
      return v;
    },
    async hash(password) {
      const bytes = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(password),
      );
      return Array.from(new Uint8Array(bytes), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
    },
  };
  root.MarineAccounts = A;
  if (typeof module !== "undefined") module.exports = A;
})(typeof window !== "undefined" ? window : globalThis);
