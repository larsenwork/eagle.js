/*
 * eagle.js v0.1.5
 *
 * @license
 * Copyright 2017, Zulko
 * Released under the ISC License
 */
'use strict';

var Slideshow = {
  props: {
    firstSlide: { default: 1 },
    startStep: { default: 1 },
    lastSlide: { default: null },
    embedded: { default: false },
    inserted: { default: false },
    keyboardNavigation: { default: true },
    mouseNavigation: { default: true },
    onStartExit: { default: function _default() {
        return function () {};
      } },
    onEndExit: { default: function _default() {
        return function () {};
      } },
    skip: { default: false },
    backBySlide: { default: false }
  },
  data: function data() {
    return {
      currentSlideIndex: 1,
      currentSlide: null,
      step: this.startStep,
      slideshowTimer: 0,
      slideTimer: 0,
      slides: [],
      active: true
    };
  },
  computed: {
    fullPageStyle: function fullPageStyle() {
      var size = 0.04 * Math.min(this.fullPageWidth, this.fullPageHeight);
      return { fontSize: size + 'px' };
    },
    embeddedStyle: function embeddedStyle() {
      var size = 0.04 * Math.min(this.parentWidth, this.parentHeight);
      return { fontSize: size + 'px' };
    },
    computedActive: function computedActive() {
      return this.slides.some(function (slide) {
        return slide.active;
      });
    }
  },
  mounted: function mounted() {
    this.isSlideshow = true;
    var self = this;
    this.findSlides();

    if (this.$root.direction === 'prev') {
      this.currentSlideIndex = this.slides.length;
    }

    if (!this.inserted) {
      this.currentSlide = this.slides[this.currentSlideIndex - 1];
      this.currentSlide.step = this.startStep;

      if (this.keyboardNavigation) {
        window.addEventListener('keydown', this.keydown);
      }
      if (this.mouseNavigation) {
        if ('ontouchstart' in window) {
          window.addEventListener('touchstart', this.click);
        } else {
          window.addEventListener('click', this.click);
          window.addEventListener('wheel', this.wheel);
        }
      }
      if (this.embedded) {
        this.$el.className += ' embedded-slideshow';
      }
    }
    window.addEventListener('resize', this.handleResize);

    if (this.preloadedImages) {
      setTimeout(function () {
        for (var image in self.preloadedImages) {
          new Image().src = self.preloadedImages[image];
        }
      }, 1000);
    }

    this.handleResize();
    this.timerUpdater = setInterval(function () {
      self.slideshowTimer++;
      self.slideTimer++;
    }, 1000);
    this.afterMounted();
  },
  beforeDestroy: function beforeDestroy() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('click', this.click);
    window.removeEventListener('touchstart', this.click);
    window.removeEventListener('wheel', this.wheel);
    clearInterval(this.timerUpdater);
  },
  methods: {
    nextStep: function nextStep() {
      this.slides.forEach(function (slide) {
        slide.direction = 'next';
      });
      this.$root.direction = 'next';
      var self = this;
      this.$nextTick(function () {
        if (self.step >= self.currentSlide.steps) {
          self.nextSlide();
        } else {
          self.step++;
        }
      });
    },
    previousStep: function previousStep() {
      this.slides.forEach(function (slide) {
        slide.direction = 'prev';
      });
      this.$root.direction = 'prev';
      var self = this;
      this.$nextTick(function () {
        if (self.step <= 1) {
          self.previousSlide();
        } else {
          self.step--;
        }
      });
    },
    nextSlide: function nextSlide() {
      var nextSlideIndex = this.currentSlideIndex + 1;
      while (nextSlideIndex < this.slides.length + 1 && (this.slides[nextSlideIndex - 1].skip || this.slides[nextSlideIndex - 1].$parent.skip)) {
        nextSlideIndex++;
      }
      if (nextSlideIndex < this.slides.length + 1) {
        this.currentSlideIndex = nextSlideIndex;
      } else if (!this.embedded) {
        this.onEndExit();
      }
    },
    previousSlide: function previousSlide() {
      var previousSlideIndex = this.currentSlideIndex - 1;
      while (previousSlideIndex >= 1 && (this.slides[previousSlideIndex - 1].skip || this.slides[previousSlideIndex - 1].$parent.skip)) {
        previousSlideIndex--;
      }
      if (previousSlideIndex >= 1) {
        this.currentSlideIndex = previousSlideIndex;
      } else if (!this.embedded) {
        this.onStartExit();
      }
    },
    handleResize: function handleResize() {
      var self = this;
      var width = 0;
      var height = 0;
      if (self.embedded) {
        width = self.$el.parentElement.clientWidth;
        height = self.$el.parentElement.clientHeight;
      } else {
        width = document.documentElement.clientWidth;
        height = document.documentElement.clientHeight;
      }
      self.$el.style.fontSize = 0.04 * Math.min(height, width) + 'px';
    },
    click: function click(evt) {
      if (this.mouseNavigation && this.currentSlide.mouseNavigation) {
        var clientX = evt.clientX != null ? evt.clientX : evt.touches[0].clientX;
        if (clientX < 0.25 * document.documentElement.clientWidth) {
          evt.preventDefault();
          this.previousStep();
        } else if (clientX > 0.75 * document.documentElement.clientWidth) {
          evt.preventDefault();
          this.nextStep();
        }
      }
    },
    wheel: function wheel(evt) {
      if (this.mouseNavigation && this.currentSlide.mouseNavigation) {
        evt.preventDefault();
        if (evt.wheelDeltaY > 0 || evt.deltaY > 0) {
          this.nextStep();
        } else if (evt.wheelDeltaY < 0 || evt.deltaY < 0) {
          this.previousStep();
        }
      }
    },
    keydown: function keydown(evt) {
      if (this.keyboardNavigation && (this.currentSlide.keyboardNavigation || evt.ctrlKey || evt.metaKey)) {
        if (evt.key === 'ArrowLeft' || evt.key === 'PageUp') {
          this.previousStep();
          evt.preventDefault();
        } else if (evt.key === 'ArrowRight' || evt.key === 'PageDown') {
          this.nextStep();
          evt.preventDefault();
        }
      }
    },
    afterMounted: function afterMounted() {},
    findSlides: function findSlides() {
      var self = this;
      var i = 0;
      this.$children.forEach(function (el) {
        if (el.isSlide) {
          i++;
          if (i >= self.firstSlide && (!self.lastSlide || i <= self.lastSlide)) {
            self.slides.push(el);
          }
        } else if (el.isSlideshow) {
          el.active = false;
          el.slides.forEach(function (slide) {
            i++;
            slide.active = false;
            if (i >= self.firstSlide && (!self.lastSlide || i <= self.lastSlide)) {
              self.slides.push(slide);
            }
          });
        }
      });
    },
    updateSlideshowVisibility: function updateSlideshowVisibility(val) {
      if (val) {
        this.$el.style.visibility = 'visible';
      } else {
        this.$el.style.visibility = 'hidden';
      }
    }
  },
  watch: {
    currentSlide: function currentSlide(newSlide, oldSlide) {
      if (oldSlide) {
        oldSlide.active = false;
        if (oldSlide.$parent !== newSlide.$parent && oldSlide.$parent !== this) {
          oldSlide.$parent.active = false;
        }
      }
      this.slideTimer = 0;
      if (this.backBySlide || newSlide.direction === 'next') {
        this.step = 1;
        newSlide.step = 1;
        newSlide.$parent.step = 1;
      } else if (newSlide.direction === 'prev') {
        this.step = newSlide.steps;
        newSlide.step = newSlide.steps;
        newSlide.$parent.step = newSlide.steps;
      }
      newSlide.active = true;
      newSlide.$parent.active = true;
    },
    currentSlideIndex: function currentSlideIndex(index) {
      this.currentSlide = this.slides[index - 1];
    },
    step: function step(val) {
      if (this.currentSlide) {
        this.currentSlide.step = val;
        this.currentSlide.$parent.step = val;
      }
    },
    active: 'updateSlideshowVisibility',
    computedActive: 'updateSlideshowVisibility'
  }
};

var Slide = { render: function render() {
    var _vm = this;var _h = _vm.$createElement;var _c = _vm._self._c || _h;return _c('eg-transition', { attrs: { "enter": _vm.enterTransition, "leave": _vm.leaveTransition } }, [_vm.active ? _c('div', { staticClass: "eg-slide" }, [_c('div', { staticClass: "eg-slide-content" }, [_vm._t("default")], 2)]) : _vm._e()]);
  }, staticRenderFns: [],
  props: {
    skip: { default: false },
    enter: { default: null },
    enterPrev: { default: null },
    enterNext: { default: null },
    leave: { default: null },
    leavePrev: { default: null },
    leaveNext: { default: null },
    steps: { default: 1 },
    mouseNavigation: { default: true },
    keyboardNavigation: { default: true }
  },
  data: function data() {
    return {
      step: 1,
      active: false,
      isSlide: true,
      slideTimer: 0,
      direction: 'next',
      transitions: {
        next: {
          enter: this.enterNext || this.enter,
          leave: this.leaveNext || this.leave
        },
        prev: {
          enter: this.enterPrev || this.enter,
          leave: this.leavePrev || this.leave
        }
      }
    };
  },
  computed: {
    enterTransition: function enterTransition() {
      return this.transitions[this.direction].enter;
    },
    leaveTransition: function leaveTransition() {
      return this.transitions[this.direction].leave;
    }
  },
  mounted: function mounted() {},
  methods: {
    nextStep: function nextStep() {
      if (this.step === this.steps) {
        this.$parent.nextSlide();
      } else {
        this.step++;
      }
    },
    previousStep: function previousStep() {
      if (this.step === 1) {
        this.$parent.previousSlide();
      } else {
        this.step--;
      }
    }
  },
  watch: {
    step: function step(val) {
      this.$parent.step = val;
    },
    active: function active(val) {
      var self = this;
      if (val) {
        this.slideTimer = 0;
        this.timerUpdater = setInterval(function () {
          self.slideTimer++;
        }, 1000);
      } else {
        clearInterval(this.timerUpdater);
      }
    }
  }
};

var AnimatedTransition = { render: function render() {
    var _vm = this;var _h = _vm.$createElement;var _c = _vm._self._c || _h;return _c('transition', { attrs: { "enter-active-class": _vm.enter ? 'animated ' + _vm.enter : '', "leave-active-class": _vm.leave ? 'animated ' + _vm.leave : '' } }, [_vm._t("default")], 2);
  }, staticRenderFns: [],
  props: {
    enter: { default: null },
    leave: { default: null }
  }
};

var main = {
  slideshow: Slideshow,
  slide: Slide,
  install: function install(Vue) {
    Vue.component('slideshow', Slideshow);
    Vue.component('slide', Slide);

    Vue.component('eg-transition', AnimatedTransition);
  }
};

module.exports = main;
