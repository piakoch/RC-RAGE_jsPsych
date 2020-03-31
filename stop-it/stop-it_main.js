/**
 * stop-it_main.js
 * Kyoung Whan Choe (https://github.com/kywch/)
 *
 * The below codes are adapted from https://github.com/fredvbrug/STOP-IT
 * 
 **/

/*
 * Generic task variables
 */
var sbjId = ""; // mturk id
var task_id = ""; // the prefix for the save file -- the main seq
var data_dir = "";
var flag_debug = false;

/* 
 * STOP-IT specific variables
 */

// Current block & trial index
var trial_ind = 1; // trial indexing variable starts at 1 for convenience
var block_ind = 0; // block indexing variables: block 0 is considered to be the practice block

// activity tracking
var focus = 'focus'; // tracks if the current tab/window is the active tab/window, initially the current tab should be focused
var fullscr_ON = 'no'; // tracks fullscreen activity, initially not activated

// ----- CUSTOMISE THE STIMULI AND RESPONSES -----
// locate the stimuli that will be used in the experiment
var fix_stim = 'https://raw.githubusercontent.com/fredvbrug/STOP-IT/master/jsPsych_version/images/fix.png';
var go_stim1 = 'https://raw.githubusercontent.com/fredvbrug/STOP-IT/master/jsPsych_version/images/go_left.png';
var go_stim2 = 'https://raw.githubusercontent.com/fredvbrug/STOP-IT/master/jsPsych_version/images/go_right.png';
var stop_stim1 = 'https://raw.githubusercontent.com/fredvbrug/STOP-IT/master/jsPsych_version/images/stop_left.png';
var stop_stim2 = 'https://raw.githubusercontent.com/fredvbrug/STOP-IT/master/jsPsych_version/images/stop_right.png';

// define the appropriate response (key) for each stimulus
// (this will also be used to set the allowed response keys)
var cresp_stim1 = 'leftarrow';
var cresp_stim2 = 'rightarrow';

// here you can change the names of the stimuli in the data file
var choice_stim1 = 'left';
var choice_stim2 = 'right';

// ----- CUSTOMISE THE BASIC DESIGN -----

// Define the proportion of stop signals.
// This will be used to determine the number of trials of the basic design (in the main experiment file):
// Ntrials basic design = number of stimuli / proportion of stop signals
// E.g., when nprop = 1/4 (or .25), then the basic design contains 8 trials (2 * 4).
// The following values are allowed: 1/6, 1/5, 1/4, 1/3. 1/4 = default (recommended) value
var nprop = 1 / 4;

// How many times should we repeat the basic design per block?
// E.g. when NdesignReps = 8 and nprop = 1/4 (see above), the number of trials per block = 64 (8*8)
// Do this for the practice and experimental phases (note: practice can never be higher than exp)
var NdesignReps_practice = 4;
var NdesignReps_exp = 8;

// Number of experimental blocks (excluding the first practice block).
// Note that NexpBl = 0 will still run the practice block
var NexpBL = 4;

// ----- CUSTOMISE THE TIME INTERVALS -----
var ITI = 500; // fixed blank intertrial interval
var FIX = 250; // fixed fixation presentation
var MAXRT = 1250; // fixed maximum reaction time
var SSD = 200; // start value for the SSD tracking procedure; will be updated throughout the experiment
var SSDstep = 50; // step size of the SSD tracking procedure; this is also the lowest possible SSD
var iFBT = 750; // immediate feedback interval (during the practice phase)
var bFBT = 15000; // break interval between blocks


/* #########################################################################
Create the design based on the input from 'experiment_variables.js'
######################################################################### */
// Since we have two stimuli, the number of trials of the basic design = 2 * nstim
// This design will later be repeated a few times for each block
// (number of repetitions is also defined in 'experiment_variables.js')
var ngostop = 1 / nprop // covert proportion to trial numbers. E.g. 1/5 = 1 stop signal and 4 go
var ntrials = ngostop * 2 // total number of trials in basic design (2 two choice stimuli x ngostop)
var signalArray = Array(ngostop - 1).fill('go'); // no-signal trials
signalArray[ngostop - 1] = ('stop'); // stop-signal trials

// create factorial design from choices(2) and signal(nstim)
var factors = {
    stim: [choice_stim1, choice_stim2],
    signal: signalArray,
};
var design = jsPsych.randomization.factorial(factors, 1);

// modify the design to make it compatible with the custom stop signal plugin
//  - set a first/second stimulus property.
//    on no-signal trials, only one image will be used (i.e. the go image/stimulus)
//    on stop-signal trials, two images will be used (i.e. the go and stop images/stimuli)
//  - set a data property with additional attributes for identifying the type of trial
for (var ii = 0; ii < design.length; ii++) {
    design[ii].data = {}
    if ((design[ii].stim == choice_stim1) && (design[ii].signal == 'go')) {
        design[ii].fixation = fix_stim;
        design[ii].first_stimulus = go_stim1;
        design[ii].second_stimulus = go_stim1;
        design[ii].data.stim = choice_stim1;
        design[ii].data.correct_response = cresp_stim1;
        design[ii].data.signal = "no";
    } else if ((design[ii].stim == choice_stim2) && (design[ii].signal == 'go')) {
        design[ii].fixation = fix_stim;
        design[ii].first_stimulus = go_stim2;
        design[ii].second_stimulus = go_stim2;
        design[ii].data.stim = choice_stim2;
        design[ii].data.correct_response = cresp_stim2;
        design[ii].data.signal = "no";
    } else if ((design[ii].stim == choice_stim1) && (design[ii].signal == 'stop')) {
        design[ii].fixation = fix_stim;
        design[ii].first_stimulus = go_stim1;
        design[ii].second_stimulus = stop_stim1;
        design[ii].data.stim = choice_stim1;
        design[ii].data.correct_response = "undefined";
        design[ii].data.signal = "yes";
    } else if ((design[ii].stim == choice_stim2) && (design[ii].signal == 'stop')) {
        design[ii].fixation = fix_stim;
        design[ii].first_stimulus = go_stim2;
        design[ii].second_stimulus = stop_stim2;
        design[ii].data.stim = choice_stim2;
        design[ii].data.correct_response = "undefined";
        design[ii].data.signal = "yes";
    }
    delete design[ii].signal;
    delete design[ii].stim;
};
if (flag_debug) {
    console.log(design); // uncomment to print the design in the browser's console
}

/*
 * Helper functions
 */
var save_url = 'https://users.rcc.uchicago.edu/~kywch/RC-RAGE_jsPsych/save_data.php';

function filter_data() {
    var ignore_columns = ['raw_rt', 'trial_type', 'first_stimulus', 'second_stimulus', 'onset_of_first_stimulus',
        'onset_of_second_stimulus', 'key_press', 'correct_response', 'trial_index', 'internal_node_id'
    ];
    var rows = {
        trial_type: 'custom-stop-signal-plugin'
    }; // we are only interested in our main stimulus, not fixation, feedback etc.
    var selected_data = jsPsych.data.get().filter(rows).ignore(ignore_columns);
    // the next piece of codes orders the columns of the data file
    var d = selected_data.values() // get the data values
    // make an array that specifies the order of the object properties
    var arr = ['block_i', 'trial_i', 'stim', 'signal', 'SSD', 'response', 'rt', 'correct',
        'focus', 'Fullscreen', 'time_elapsed', 'window_resolution'
    ];
    new_arr = [] // we will fill this array with the ordered data
    function myFunction(item) { // this is function is called in the arr.forEach call below
        new_obj[item] = obj[item]
        return new_obj
    }
    // do it for the whole data array
    for (i = 0; i < d.length; i++) {
        obj = d[i]; // get one row of data
        new_obj = {};
        arr.forEach(myFunction) // for each element in the array run my function
        selected_data.values()[i] = new_obj; // insert the ordered values back in the jsPsych.data object
    }
    return selected_data;
}

function save_data() {
    var selected_data = filter_data();
    if (flag_debug) {
        console.log("Save data function called.");
        console.log(selected_data.csv());
    }
    jQuery.ajax({
        type: 'post',
        cache: false,
        url: save_url, // this is the path to the above PHP script
        data: {
            data_dir: function () {
                return data_dir;
            },
            task_id: function () {
                return task_id;
            },
            sbj_id: function () {
                return sbjId;
            },
            sess_data: selected_data.csv()
        }
    });
}


/*
 * Instruction block
 */
function generate_instruction_block(num_mainblock) {
    var block_instruction = [];
    var stop_signal_instructions = {
        type: "instructions",
        pages: [
            '<div class = centerbox><p class = block-text>Your main task is to respond to green arrows that appear on the screen.</p>' +
            ' <p class = block-text>Press the <font color=blue><b>LEFT ARROW KEY</b></font> with the right index finger when you see a <font color=blue><b>LEFT ARROW</b></font>' +
            ' and press the <font color=green><b>RIGHT ARROW KEY</b></font> with the right ring finger when you see a <font color=green><b>RIGHT ARROW</b></font>.</p>' +
            ' <p class = block-text><b>Thus, <font color=blue>left arrow = left key</font> and <font color=green>right arrow = right key</font>.</p></b></div>',
            '<div class = centerbox><p class = block-text>However, on some trials (stop-signal trials) the arrows will be replaced by <font color=red><b>"XX"</b></font> after a variable delay.' +
            ' These <font color=red><b>XXs (stop signals)</b></font> indicate that you have to stop your response.</p>' +
            ' <p class = block-text>On approximately half of the stop-signal trials, the stop signal will appear soon and you will notice that it will be easy to stop your response.</p>' +
            ' <p class = block-text>On the other half of the trials, the stop signals will appear late and it will become very difficult or even impossible to stop your response.</p></div>',
            '<div class = centerbox><p class = block-text>Nevertheless, it is really important that you do not wait for the stop signal to occur and that you respond as quickly and as accurately as possible to the arrows.</p>' +
            ' <p class = block-text>After all, if you start waiting for stop signals, then the program will delay their presentation. This will result in long reaction times.</p></div>',
            '<div class = centerbox><p class = block-text>We will start with a short practice block in which you will receive immediate feedback. You will no longer receive immediate feedback in the experimental phase.</p>' +
            ' <p class = block-text>However, at the end of each experimental block, there will be a 15 second break. During this break, we will show you some information about your mean performance in the previous block.</p></div>',
            '<div class = centerbox><p class = block-text>The experiment consists of 1 practice block and ' + num_mainblock.toString() + ' experimental blocks.</p></div>'
        ],
        show_clickable_nav: true
    };
    block_instruction.push(stop_signal_instructions);
    return {
        timeline: block_instruction
    };
}


/* 
 * Shared task components
 */

// start of each block
var block_start_page = {
    type: 'html-keyboard-response',
    stimulus: '<p class = center-text>Press space to begin.</p>',
    choices: ['space']
};

// get ready for beginning of block
// the get ready message is declared in the configuration/text_variables.js file
var block_get_ready = {
    type: 'html-keyboard-response',
    stimulus: '<p class = center-text>Get ready...</p>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 2000
};

// blank inter-trial interval
var blank_ITI = {
    type: 'jspsych-detect-held-down-keys',
    stimulus: "",
    trial_duration: ITI / 2,
    response_ends_trial: false
};

// now put the trial in a node that loops (if response is registered)
var held_down_node = {
    timeline: [blank_ITI],
    loop_function: function (data) {
        if (data.values()[0].key_press != null) {
            return true; // keep looping when a response is registered
        } else {
            return false; // break out of loop when no response is registered
        }
    }
};

// the main stop-signal trial
// use custom-stop-signal-plugin.js to show three consecutive stimuli within one trial
// (fixation -> first stimulus -> second stimulus, with variable inter-stimuli-intervals)
var stop_signal_trial = {
    type: 'custom-stop-signal-plugin',
    fixation: jsPsych.timelineVariable('fixation'),
    fixation_duration: FIX,
    stimulus1: jsPsych.timelineVariable('first_stimulus'),
    stimulus2: jsPsych.timelineVariable('second_stimulus'),
    trial_duration: MAXRT, // this is the max duration of the actual stimulus (excluding fixation time)
    // inter stimulus interval between first and second stimulus = stop signal delay (SSD)
    ISI: function () {
        return SSD;
    },
    response_ends_trial: true,
    choices: [cresp_stim1, cresp_stim2],
    data: jsPsych.timelineVariable('data'),
    // was the response correct? adapt SSD accordingly    
    on_finish: function (data) {
        // check if the response was correct
        // keys are stored in keycodes not in character, so convert for convenience
        if (data.key_press == null) {
            // convert explicitly to string so that "undefined" (no response) does not lead to empty cells in the datafile
            data.response = "undefined";
        } else {
            data.response = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.key_press);
        }
        data.correct = (data.response == data.correct_response);

        // if no response was made, the reaction time should not be -250 but null
        if (data.rt == -250) {
            data.rt = null
        };

        // on go trials, reaction times on the fixation (below zero) are always wrong
        if (data.signal == 'no' && data.rt < 0) {
            data.correct = false;
        };

        // set and adapt stop signal delay (SSD)
        data.SSD = SSD;
        data.trial_i = trial_ind;
        data.block_i = block_ind;
        trial_ind = trial_ind + 1;
        if (data.signal == 'yes') {
            if (data.correct) {
                SSD = SSD + SSDstep;
                if (SSD >= MAXRT) {
                    SSD = MAXRT - SSDstep;
                }
            } else {
                SSD = SSD - SSDstep;
                if (SSD <= SSDstep) {
                    SSD = SSDstep;
                }
            }
        }
    }
};

// trial-by-trial feedback -- only present during the practice
var trial_feedback = {
    type: 'html-keyboard-response',
    choices: jsPsych.NO_KEYS,
    trial_duration: iFBT,
    stimulus: function () {
        var last_trial_data = jsPsych.data.get().last(1).values()[0];
        if (last_trial_data['signal'] === 'no') {
            // go trials
            if (last_trial_data['correct']) {
                return '<p class = center-text>Correct!</p>';
            } else {
                if (last_trial_data['response'] === "undefined") {
                    // no response previous trial
                    return '<p class = center-text><font color=red>TOO SLOW</font></p>';
                } else {
                    if (last_trial_data['rt'] >= 0) {
                        return '<p class = center-text><font color=red>INCORRECT RESPONSE</font></p>';
                    } else {
                        return '<p class = center-text><font color=red>TOO FAST</font></p>';
                    }
                }
            }
        } else {
            // stop trials
            if (last_trial_data['correct']) {
                return '<p class = center-text>Correct!</p>';
            } else {
                if (last_trial_data['rt'] >= 0) {
                    return '<p class = center-text><font color=red>REMEMBER: try to STOP</font></p>';
                } else {
                    return '<p class = center-text><font color=red>TOO FAST</font></p>';
                }
            }
        }
    },
    on_finish: function () {
        if (trial_ind > NdesignReps_practice * ntrials) {
            jsPsych.endCurrentTimeline();
        }
    }
};

// at the end of the block, give feedback on performance
var block_feedback = {
    type: 'html-keyboard-response',
    trial_duration: bFBT,
    choices: function () {
        if (block_ind == NexpBL) {
            return ['p', 'space']
        } else {
            return ['p'] // 'p' can be used to skip the feedback, useful for debugging
        }
    },
    stimulus: function () {
        // calculate performance measures
        var ns_trials = jsPsych.data.get().filter({
            trial_type: 'custom-stop-signal-plugin',
            block_i: block_ind,
            signal: 'no'
        });
        var avg_nsRT = Math.round(ns_trials.select('rt').subset(function (x) {
            return x > 0;
        }).mean());
        var prop_ns_Correct = Math.round(ns_trials.filter({
                correct: true
            }).count() / ns_trials.count() * 1000) /
            1000; // unhandy multiplying and dividing by 1000 necessary to round to two decimals
        var prop_ns_Missed = Math.round(ns_trials.filter({
            key_press: null
        }).count() / ns_trials.count() * 1000) / 1000;
        var prop_ns_Incorrect = Math.round((1 - (prop_ns_Correct + prop_ns_Missed)) * 1000) / 1000;
        var ss_trials = jsPsych.data.get().filter({
            trial_type: 'custom-stop-signal-plugin',
            block_i: block_ind,
            signal: 'yes'
        });
        var prop_ss_Correct = Math.round(ss_trials.filter({
            correct: true
        }).count() / ss_trials.count() * 1000) / 1000;

        // in the last block, we should not say that there will be a next block
        if (block_ind == NexpBL) {
            var next_block_text = "<p class = block-text>Press space to continue...</p>";
        } else { // make a countdown timer
            var count = (bFBT / 1000);
            var counter;
            clearInterval(counter);
            counter = setInterval(timer, 1000); //1000 will run it every 1 second
            function timer() {
                count = count - 1;
                if (count <= 0) {
                    clearInterval(counter);
                }
                document.getElementById("timer").innerHTML = count;
            }
            // insert countdown timer
            var next_block_text = "<p class = block-text>You can take a short break, the next block starts in <span id='timer'>15</span> s</p>";
        }

        // the final text to present. Can also show correct and incorrect proportions if requested.
        return "<div class = centerbox>" +
            "<p class = block-text><b>GO TRIALS: </b></p>" +
            sprintf("<p class = block-text>Average response time = %d ms</p>", avg_nsRT) +
            sprintf("<p class = block-text>Proportion missed go = %.2f (should be 0)</p>", prop_ns_Missed) +
            "<p class = block-text><b>STOP-SIGNAL TRIALS: </b></p>" +
            sprintf("<p class = block-text>Proportion correct stops = %.2f (should be close to 0.5)</p>", prop_ss_Correct) +
            next_block_text + '</div>';
    },
    on_finish: function () {
        save_data();
        trial_ind = 1; // reset trial counter
        block_ind = block_ind + 1; // next block
    }
};

// return the one-short-practice block timeline
function generate_practice_block() {
    var trial_seq = {
        timeline: [blank_ITI, held_down_node, stop_signal_trial, trial_feedback],
        timeline_variables: design,
        randomize_order: true,
        repetitions: NdesignReps_exp
    }
    return {
        timeline: [block_start_page, block_get_ready, trial_seq, block_feedback],
        randomize_order: false
    };
}

var start_main_page = {
    type: "instructions",
    pages: [
        '<div class = centerbox><p class = block-text>The practice is finished. You will no longer receive immediate feedback in the next phase.</p></div>',
        '<div class = centerbox><p class = block-text>However, at the end of each block, there will still be a 15 second break. During this break, we will show you some information about your mean performance in the previous block.</p></div>',
        '<div class = centerbox><p class = block-text>There are ' + NexpBL.toString() + ' more blocks to go.</p>' +
        ' <p class = block-text>Please click next when you are ready!</p></div>'
    ],
    show_clickable_nav: true
};

// return the four-main-blocks timeline
function generate_main_block(num_mainblock) {
    var trial_seq = {
        timeline: [blank_ITI, held_down_node, stop_signal_trial],
        timeline_variables: design,
        randomize_order: true,
        repetitions: NdesignReps_exp
    }
    return {
        timeline: [block_start_page, block_get_ready, trial_seq, block_feedback],
        randomize_order: false,
        repetitions: num_mainblock
    };
}
