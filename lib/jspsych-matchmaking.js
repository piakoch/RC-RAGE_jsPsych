/**
 * jspsych-matchmaking
 * Kyoung whan Choe (https://github.com/kywch/)
 * Michael Meidenbauer (https://github.com/mmeidenbauer)
 * plugin to display a fake matchmaking screen with an arbitrary "matchmaking" time to find an opponent
 *
 **/

 /*
 * Example plugin template
 */

jsPsych.plugins["matchmaking"] = (function() {

    var plugin = {};
  
    plugin.info = {
      name: "matchmaking",
      parameters: {
        // matchmaking_min_duration: {
        //   type: jsPsych.plugins.parameterType.INT,
        //   pretty_name: 'Minimum matchmaking duration',
        //   default: 10000,
        //   description: 'Minimum length of time in ms for the matchmaker to "find" an opponent'
        // },
        // matchmaking_max_duration: {
        //   type: jsPsych.plugins.parameterType.INT,
        //   pretty_name: 'Maximum matchmaking duration',
        //   default: 10000,
        //   description: 'Maximium length of time in ms for the matchmaker to "find" an opponent'
        // },
        matchmaking_duration: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Matchmaking duration in ms',
          default: 18000,
          description: 'The amount of time it takes for the matchmaker to "find" an opponent (in ms)'
        },
        matchmaking_initialize_duration: {
          type: jsPsych.plugins.parameterType.INT,
          pretty_name: 'Matchmaking initialize screen duration in ms',
          default: 5000,
          description: 'The amount of time it takes for the matchmaker to initialize a game session after "finding" an opponent (in ms)'
        },
        matchmaking_display_text: {
          type: jsPsych.plugins.parameterType.STRING,
          pretty_name: 'Matchmaking display text',
          default: 'Please wait while we find an opponent...',
          description: 'Text shown when matchmaking appears to be running.'
        },
        matchmaking_confirmation_text: {
          type: jsPsych.plugins.parameterType.STRING,
          pretty_name: 'Maximum confirmation text',
          default: 'Opponent found. Initializing game session.',
          description: 'Text shown when matchmaking appears to be complete and the game session is booting.'
        },
      }
    }
  
    plugin.trial = function(display_element, trial) {

        const { matchmaking_display_text, matchmaking_confirmation_text, matchmaking_duration, matchmaking_initialize_duration } = trial;

        display_element.innerHTML += '<div class="game-message matchmaker">' +
            `${matchmaking_display_text}` + 
        '</div>';

        flag_debug && console.log(`duration: ${duration/ 1000} seconds`);
  
      // save matchmaking duration
    //   var trial_data = {
    //     matchmaking_duration: duration,
    //   };
      
      // switch to the confirmation screen after the duration and show that screen for five seconds before ending the trial
      setTimeout(() => {
          const elementToUpdate = document.querySelector('.matchmaker');
        elementToUpdate.innerHTML = 
        `${matchmaking_confirmation_text}`;
        setTimeout(() => {
            jsPsych.finishTrial();
        }, matchmaking_initialize_duration);
      }, matchmaking_duration);
    };
  
    return plugin;
  })();