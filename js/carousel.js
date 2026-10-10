(function(root) {
  function createCarousel({count, onChange = () => {}, interval = 8000, reducedMotion = false, setTimer = setTimeout, clearTimer = clearTimeout}) {
    let index = 0, timer, destroyed = false, userPaused = false;
    const reasons = new Set(reducedMotion ? ['reduced'] : []);
    const state = () => ({index, userPaused, paused: userPaused || reasons.size > 0, reducedMotion: reasons.has('reduced')});
    function schedule() {
      clearTimer(timer);
      if (destroyed || count < 2 || state().paused) return;
      timer = setTimer(() => {index = (index + 1) % count; emit(false);}, interval);
    }
    function emit(manual) {onChange({...state(), manual}); schedule();}
    function go(value) {
      if (destroyed || count < 1) return;
      index = ((value % count) + count) % count;
      userPaused = true;
      emit(true);
    }
    const api = {
      state, go,
      next: () => go(index + 1), previous: () => go(index - 1),
      pause(reason) {if (!destroyed) {reasons.add(reason); emit(false);}},
      resume(reason) {if (!destroyed) {reasons.delete(reason); emit(false);}},
      toggle() {if (!destroyed) {userPaused = !userPaused; emit(false);}},
      destroy() {destroyed = true; clearTimer(timer);}
    };
    emit(false);
    return api;
  }
  root.MarineCarousel = {createCarousel};
  if (typeof module !== 'undefined') module.exports = {createCarousel};
})(typeof window !== 'undefined' ? window : globalThis);
