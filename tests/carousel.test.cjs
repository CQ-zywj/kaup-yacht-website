const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createCarousel} = require('../js/carousel.js');

function setup(reducedMotion = false) {
  let scheduled;
  const changes = [];
  const carousel = createCarousel({count:3, reducedMotion,
    setTimer(callback) {scheduled = callback; return 1;},
    clearTimer() {scheduled = null;},
    onChange(state) {changes.push(state);}
  });
  return {carousel, changes, tick() {const callback = scheduled; scheduled = null; callback?.();}, scheduled: () => !!scheduled};
}
test('automatic carousel advances and wraps without declaring a manual change', () => {
  const s = setup();
  s.tick(); assert.equal(s.carousel.state().index, 1);
  s.tick(); s.tick(); assert.equal(s.carousel.state().index, 0);
  assert.equal(s.changes.at(-1).manual, false);
});
test('overlapping focus, hover and hidden pauses cannot resume prematurely', () => {
  const s = setup();
  s.carousel.pause('focus'); s.carousel.pause('hover');
  s.carousel.resume('hover'); assert.equal(s.scheduled(), false);
  s.carousel.resume('focus'); assert.equal(s.scheduled(), true);
  s.carousel.pause('hidden'); s.tick(); assert.equal(s.carousel.state().index, 0);
});
test('manual navigation stops autoplay until explicitly resumed', () => {
  const s = setup();
  s.carousel.go(2); assert.equal(s.carousel.state().index, 2);
  assert.equal(s.carousel.state().userPaused, true);
  assert.equal(s.scheduled(), false);
  s.carousel.toggle(); s.tick(); assert.equal(s.carousel.state().index, 0);
});
test('reduced motion disables autoplay while keeping manual navigation', () => {
  const s = setup(true);
  assert.equal(s.scheduled(), false);
  s.carousel.next(); assert.equal(s.carousel.state().index, 1);
  s.carousel.toggle(); assert.equal(s.scheduled(), false);
});
test('destroy cancels timer and ignores future interactions', () => {
  const s = setup(); s.carousel.destroy();
  s.carousel.next(); s.carousel.resume('focus');
  assert.equal(s.scheduled(), false); assert.equal(s.carousel.state().index, 0);
});
