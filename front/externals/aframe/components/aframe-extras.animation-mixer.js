(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

  AFRAME.registerComponent(
    'animation-mixer',
    require('./tmp/aframe-extras.animation-mixer/index.js')
  );
},{"./tmp/aframe-extras.animation-mixer/index.js":2}],2:[function(require,module,exports){
/**
 * animation-mixer
 *
 * Player for animation clips. Intended to be compatible with any model format that supports
 * skeletal or morph animations through THREE.AnimationMixer.
 * See: https://threejs.org/docs/?q=animation#Reference/Animation/AnimationMixer
 */
module.exports = {
  schema: {
    clip:  {default: '*'},
    duration: {default: 0}
  },

  init: function () {
    /** @type {THREE.Mesh} */
    this.model = null;
    /** @type {THREE.AnimationMixer} */
    this.mixer = null;
    /** @type {Array<THREE.AnimationAction>} */
    this.activeActions = [];

    var model = this.el.getObject3D('mesh');

    if (model) {
      this.load(model);
    } else {
      this.el.addEventListener('model-loaded', function(e) {
        this.load(e.detail.model);
      }.bind(this));
    }
  },

  load: function (model) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model);
    if (this.data.clip) this.update({});
  },

  remove: function () {
    if (this.mixer) this.mixer.stopAllAction();
  },

  update: function (previousData) {
    if (!previousData) return;

    var data = this.data,
        activeActions = this.activeActions;

    if (data.clip !== previousData.clip) {
      if (activeActions.length) this.mixer.stopAllAction();
      if (data.clip) this.playClip(data.clip);
    }

    if (!activeActions.length) return;

    if (data.duration) {
      for (var action, i = 0; (action = activeActions[i]); i++) {
        action.setDuration(data.duration);
      }
    }
  },

  playClip: function (clipName) {
    if (!this.mixer) return;

    var model = this.model,
        clips = model.animations || (model.geometry || {}).animations || [];

    if (!clips.length) return;

    var re = wildcardToRegExp(clipName);

    this.activeActions.length = 0;
    for (var clip, action, i = 0; (clip = clips[i]); i++) {
      if (clip.name.match(re)) {
        action = this.mixer.clipAction(clip, model);
        action.play();
        this.activeActions.push(action);
      }
    }
  },

  tick: function (t, dt) {
    if (this.mixer && !isNaN(dt)) this.mixer.update(dt / 1000);
  }
};

/**
 * Creates a RegExp from the given string, converting asterisks to .* expressions,
 * and escaping all other characters.
 */
function wildcardToRegExp (s) {
  return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
}

/**
 * RegExp-escapes all characters in the given string.
 */
function regExpEscape (s) {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

},{}]},{},[1]);
