var util = require('util'); 

/**
 * -------
 * Helpers
 * -------
 */
var dist = function(v1, v2) {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) +
                   (v1.y - v2.y) * (v1.y - v2.y));
};

var scalar = function(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

var norm = function(v) {
  return Math.sqrt(scalar(v,v));
}

var angle = function(v1, v2) {
  return Math.acos(scalar(v1, v2) / (norm(v1) * norm(v2)));
};

var azimut = function(ship, target) {
  var v = { 
    x: target.state.p.x - ship.state.p.x,
    y: target.state.p.y - ship.state.p.y
  };
  var t = angle({ x: 1, y: 0 }, v);
  if(v.y > 0) return t;
  else return -t;
};


/**
 * --------------
 * Initialization
 * --------------
 */
var my = {};

/*
 *  The `init` function is called with the number of ships active per
 *  phl0cks in this game. The `init` function is a good place to
 *  initialize your data structure and prepare everything for the
 *  first call to control. Any global variable defined here will be
 *  preserved and accessible by the control function at each control
 *  phase.
 *
 * @param size number of ships per phl0ck
 * @param spec specifications of the simulated world
 */
exports.init = function(size, spec) {
  my.spec = spec;
  my.size = size;
};

/**
 * -------
 * Control
 * -------
 *
 *  The `control` function is called at each control phase. The funciton
 *  is called once for every ship controlled by this fl0ck. The control
 *  function should implement your AI algorithm and return an object with
 *  two fields `theta` and `sigma`.
 *  `theta`  if defined the angle of the thrust to apply over the next
 *           control period (in radians)
 *  `sigma`  if defined the angle to use to shoot a new missile in the
 *           current simulation step if the ship still has missiles
 *
 * @param step     the current simulation step
 * @param t        the time equivalent of the current step in ms 
 * @param ship     the state and description of the ship to control 
 * @param ships    the array of all other ships still alive
 * @param missiles the array of all the missiles still in the wild
 *
 * @return { theta, sigma } control values
 */
exports.control = function(step, t, ship, ships, missiles) {
  var theta = undefined;
var sigma = undefined;
  
  var min = my.spec.HALFSIZE * 2;
  var track = null;

//closest ship
/*
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(d < min && s.desc.owner !== ship.desc.owner) 
	{
      min = d;
      track = s;
    }
  });
*/
//last ship
ships.forEach(function(s) {
    if(s.desc.owner !== ship.desc.owner) 
	{
      track = s;
    }
  });

  if(track) {
	var a = azimut(ship, track);

    sigma = a;
	
	var vector = { 
	    x: track.state.v.x - ship.state.v.x,
	    y: track.state.v.y - ship.state.v.y
	  };
	var t = angle({ x: 1, y: 0 }, vector);
	if(vector.y > 0) 
	theta =  t;
	  else 
	theta = -t;
	
	//get closer if azimuth and target.speed are in the same direction
	var vectorBetweenTargetAndShip = { 
	    x: track.state.p.x - ship.state.p.x,
	    y: track.state.p.y - ship.state.p.y
	  };
	if(scalar(track.state.v,vectorBetweenTargetAndShip) >0)
	{
      theta = a * 0.2 + theta * 0.8;
    }
  }

  return { 
    theta: theta,
    sigma: sigma
  };
};


