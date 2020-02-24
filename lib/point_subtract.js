/**
 * point_subtract.js
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * jspsych plugin for threading the PSAP trials
 * 
 **/

/*
 * Generic task variables
 */
var sbjId = ""; // mturk id
var task_id = ""; // the prefix for the save file -- the main seq
var data_dir = "";

/* 
 * PSAP specific variables
 */
var flag_debug = false;
var main_score = 0;
var prac_score = 20;
var prac_time = 2 * 60 * 1000; // ms
var circle_loc = null;
if (flag_debug) {
    // shooting for 3 trials (6 harvests) within 2 minutes
    var time_limit = 3 * 60 * 1000; // ms
    var main_seq = [Infinity].concat(jsPsych.randomization.shuffle([1, 2, 3, 4, 6, 7, Infinity, Infinity]));
    var break_after_trial = [2];
    var break_after_trial = [3, 7];

} else {
    var time_limit = 12 * 60 * 1000; // ms
    var main_seq = [Infinity].concat(jsPsych.randomization.shuffle([1, 2, 3, 4, 6, 7, Infinity, Infinity]));
    main_seq = main_seq.concat(jsPsych.randomization.shuffle([1, 2, 3, 4, 6, 7, Infinity, Infinity, Infinity]));
    main_seq = main_seq.concat(jsPsych.randomization.shuffle([1, 2, 3, 4, 6, 7, Infinity, Infinity, Infinity]));
    var break_after_trial = [3, 7, 11, 15, 19, 23];
}
var score_history = [];
var click_history = [];
var wasted_click_history = [];


/*
 * Helper functions
 */
var save_url = 'https://users.rcc.uchicago.edu/~kywch/PSAP_jsPsych/save_data.php';

function save_data() { // CHECK THE URL before use
    if (flag_debug) {
        console.log("Save data function called.");
        console.log(jsPsych.data.get().json());
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
            sess_data: jsPsych.data.get().json()
        }
    });

}

var audio_url = 'https://raw.githubusercontent.com/kywch/PSAP_jsPsych/master/sounds/';
var audio_seed = ['c', 'd', 'g', 'k', 'p', 'q', 't'];

function get_audio_url(audio_char) { // CHECK THE URL before use
    return audio_url + audio_char + '.wav';
}

/*
 * Audio check block
 */
function generate_audiotest_block() {

    var audio_testseq = jsPsych.randomization.shuffle([...audio_seed]);

    var block_audiotest = [];

    var enter_audiotest_page = {
        type: 'audio-keyboard-with-replay',
        prompt: "<div class = centerbox><p class = block-text>" +
            "The task you are about to do requires listening to sounds. Please adjust your sound setting. " +
            "Before going into the main task, we will do a simple task to make sure you can hear the sounds. </p>" +
            "<p class = block-text>In the next pages, press the alphabet key associated with the played sound to proceed. </p> " +
            "<p class = block-text>If you are ready, press the <strong>'n'</strong> key to proceed.</p>" +
            "<p class = block-text>If the key doesn't work, please click the screen and press again.</p></div>",
        choices: ['n'],
        data: {
            exp_stage: 'enter_audiotest_page'
        }
    };
    block_audiotest.push(enter_audiotest_page);

    for (var ii = 0; ii < audio_testseq.length; ii++) {
        var audiotest_trial = {
            type: 'audio-keyboard-with-replay',
            stimulus: get_audio_url(audio_testseq[ii]),
            prompt: "<div class = centerbox><p class = block-text>" +
                "Trial " + (ii + 1) + " / " + audio_testseq.length + " : " +
                "Please press the alphabet key you just heard.</p> " +
                "<p class = block-text>To replay, press the <strong>'r'</strong> key. </p></div>",
            choices: [audio_testseq[ii]],
            data: {
                exp_stage: 'audiotest_trial_' + ii.toString(),
                played_audio: audio_testseq[ii]
            }
        }
        block_audiotest.push(audiotest_trial);
    }

    return block_audiotest;
}


/*
 * Instruction page -> import image instructions and display
 */
function generate_instruction_block(instr_url, takeBackAmount = 0) {

    var block_instruction = [];

    var PSAP_instruction_page_1 = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide1.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide2.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide3.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide4.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide5.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide6.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide7.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide8.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide9.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide10.JPG">'
        ],
        data: {
            exp_stage: 'PSAP_instruction_page_1',
            task_id: function () {
                return task_id;
            },
            sbj_id: function () {
                return sbjId;
            }
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true
    };
    block_instruction.push(PSAP_instruction_page_1);

    // single money-making practice trial
    var PSAP_instruction_harvest_practice = {
        type: 'point-subtract',
        prompt: '<div width="800px"><p class = block-text><i>Click the green apple and earn 20 cents to proceed.</i></p></div>',
        data: {
            exp_stage: 'PSAP_instruction_harvest_practice',
            task_id: function () {
                return task_id;
            },
            sbj_id: function () {
                return sbjId;
            }
        }
    };
    block_instruction.push(PSAP_instruction_harvest_practice);

    var PSAP_instruction_page_2 = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide12.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide13.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide14.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide15.JPG">'
        ],
        data: {
            exp_stage: 'PSAP_instruction_page_2'
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true
    };
    block_instruction.push(PSAP_instruction_page_2);

    // after this stealing happens
    var PSAP_instruction_steal = {
        type: 'audio-keyboard-with-replay',
        stimulus: 'https://raw.githubusercontent.com/kywch/PSAP_jsPsych/master/sounds/170623__jorickhoofd__funny-high-giggle.wav',
        prompt: '<img class="resize" src="' + instr_url + 'Slide16.JPG">',
        choices: ['y'],
        replay_key: 'n',
        data: {
            exp_stage: 'PSAP_instruction_steal'
        }
    }
    block_instruction.push(PSAP_instruction_steal);

    var PSAP_instruction_page_3 = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide17.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide18.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide19.JPG">'
        ],
        data: {
            exp_stage: 'PSAP_instruction_page_3'
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true
    };
    block_instruction.push(PSAP_instruction_page_3);

    // after this stealing happens
    var PSAP_instruction_escape = {
        type: 'audio-keyboard-with-replay',
        stimulus: 'https://raw.githubusercontent.com/kywch/PSAP_jsPsych/master/sounds/Yahoo-SoundBible.com-1888534056.wav',
        prompt: '<img class="resize" src="' + instr_url + 'Slide20.JPG">',
        choices: ['y'],
        replay_key: 'n',
        data: {
            exp_stage: 'PSAP_instruction_escape'
        }
    }
    block_instruction.push(PSAP_instruction_escape);

    var PSAP_instruction_page_4 = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide21.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide22.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide23.JPG">'
        ],
        data: {
            exp_stage: 'PSAP_instruction_page_4'
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true
    };
    block_instruction.push(PSAP_instruction_page_4);

    // single shooting practice trial
    var PSAP_instruction_shooting_practice = {
        type: 'point-subtract',
        start_points: 15,
        prompt: '<p class = block-text><i>Destroy the smiley robber to continue.</i></p>',
        shoot_prac: true,
        takeback_amount: takeBackAmount,
        data: {
            exp_stage: 'PSAP_instruction_shooting_practice'
        }
    };
    block_instruction.push(PSAP_instruction_shooting_practice);

    var PSAP_instruction_page_5 = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide25.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide26.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide27.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide28.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide29.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide30.JPG">'
        ],
        data: {
            exp_stage: 'PSAP_instruction_page_5'
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true,
        on_finish: function () {
            save_data();
            circle_loc = null;
        }
    };
    block_instruction.push(PSAP_instruction_page_5);

    return block_instruction;
}


/*
 * 2 minutes of task practice
 */
function generate_practice_block(takeBackAmount = 0, smileyGoneBeforeHarvest = true, audioTest = true) {
    // time limit: 2 minutes
    var prac_seq = [5, 5, 5, 5, 5, 5]; // [3, 7, 3, 7, 3, 7];
    var audio_testseq = jsPsych.randomization.shuffle([...audio_seed]);

    if (flag_debug) {
        console.log("Take back amount: ", takeBackAmount);
        console.log("Smiley gone before harvest: ", smileyGoneBeforeHarvest);
        console.log("Audio test: ", audioTest);
    }

    var block_sequence = [];

    for (var ii = 0; ii < prac_seq.length; ii++) {

        var continuous_psap = {
            type: 'point-subtract',
            start_points: function () {
                return prac_score;
            },
            time_remain: function () {
                return prac_time;
            },
            prev_circle_loc: function () {
                return circle_loc;
            },
            prompt: '<div style="width:800px"><p class = block-text><i>Try to earn as many cents as possible for the next 2 minutes of practice.</p></div>',
            //prompt: '<div style="width:800px"><p class = block-text><i>Feel free to try anything for the next 2 minutes of practice. ' +
            //    'The practice points will <b>NOT</b> be exchanged for money.</i></p></div>',
            steal_timing: prac_seq[ii],
            escape_before_harvest: smileyGoneBeforeHarvest,
            takeback_amount: takeBackAmount,
            data: {
                exp_stage: 'practice_trial_PSAP_' + (ii + 1).toString()
            },
            on_finish: function (data) {
                // update the score and circle_loc
                prac_score = prac_score + data.points_trial;
                prac_time = data.time_remain;
                circle_loc = data.last_circle_loc;
            }
        };
        block_sequence.push(continuous_psap);

        // audio-test break
        var audiotest_trial = {
            type: 'audio-keyboard-with-replay',
            time_remain: function () {
                return prac_time;
            },
            stimulus: get_audio_url(audio_testseq[ii]),
            prompt: "<div class = centerbox><p class = block-text>" +
                "<p class = block-text><font color=red><strong>Attention check!</strong> THE TIMER IS STILL RUNNING.</font></p>" +
                "<p class = block-text>Please press the alphabet key you just heard.</p> " +
                "<p class = block-text>To replay, press the <strong>'r'</strong> key. </p></div>",
            choices: [audio_testseq[ii]],
            data: {
                exp_stage: 'audiotest_trial_' + ii.toString(),
                played_audio: audio_testseq[ii]
            },
            on_finish: function (data) {
                if (flag_debug) {
                    console.log("Audio-test RT: ", data.rt, prac_time);
                }
                // update the time
                prac_time = prac_time - data.rt;
            }
        };
        if (audioTest) {
            if ([0, 2].includes(ii)) {
                block_sequence.push(audiotest_trial);
            }
        }
    }
    return block_sequence;
}


/*
 * 18 minutes of task practice
 */
function generate_main_block(takeBackAmount = 0, smileyGoneBeforeHarvest = true, audioTest = true) {

    var audio_testseq = jsPsych.randomization.shuffle([...audio_seed]);

    var block_sequence = [];

    // we may want to provide more information here
    // also mention the middle rest block
    var block_start_page = {
        type: 'instructions',
        pages: [
            '<div class = centerbox><p class = block-text>The main game is about to begin.</p>' +
            '<p class = block-text>Try to earn as many cents as possible for the next 12 minutes.</p></div>',
            '<div class = centerbox><p class = block-text>Take a deep breath, and click Next to begin the main game!</p></div>'
        ],
        allow_keys: false,
        show_clickable_nav: true,
        allow_backward: false,
        show_page_number: false,
        data: {
            exp_stage: 'main_start_page',
            task_id: function () {
                return task_id;
            },
            sbj_id: function () {
                return sbjId;
            },
            main_seq: main_seq
        },
        on_finish: function () {
            // again resetting the circle location
            circle_loc = null;
        }
    };
    block_sequence.push(block_start_page);

    for (var ii = 0; ii < main_seq.length; ii++) {
        var continuous_psap = {
            type: 'point-subtract',
            start_points: function () {
                return main_score;
            },
            time_remain: function () {
                return time_limit;
            },
            prev_circle_loc: function () {
                return circle_loc;
            },
            steal_timing: main_seq[ii],
            data: {
                exp_stage: 'main_trial_PSAP_' + (ii + 1).toString()
            },
            on_finish: function (data) {
                // update the variables to feed into the next trial
                main_score = main_score + data.points_trial;
                time_limit = data.time_remain;
                circle_loc = data.last_circle_loc;

                // quick result summary
                score_history.push(data.points_trial);
                click_history.push(data.click_history.length);
                wasted_click_history.push(data.wasted_click);
            }
        };
        block_sequence.push(continuous_psap);

        // break page
        if (break_after_trial.includes(ii)) {

            var audiotest_trial = {
                type: 'audio-keyboard-with-replay',
                time_remain: function () {
                    return time_limit;
                },
                stimulus: get_audio_url(audio_testseq[Math.floor(ii / 4)]),
                prompt: "<div class = centerbox><p class = block-text>" +
                    "<p class = block-text><font color=red><strong>Attention check!</strong> THE TIMER IS STILL RUNNING.</font></p>" +
                    "<p class = block-text>Please press the alphabet key you just heard.</p> " +
                    "<p class = block-text>To replay, press the <strong>'r'</strong> key. </p></div>",
                choices: [audio_testseq[Math.floor(ii / 4)]],
                data: {
                    exp_stage: 'audiotest_trial_' + ii.toString(),
                    played_audio: audio_testseq[Math.floor(ii / 4)]
                },
                on_finish: function (data) {
                    save_data();
                    if (flag_debug) {
                        console.log("Audio-test RT: ", data.rt, time_limit);
                    }
                    // update the time
                    time_limit = time_limit - data.rt;
                }
            }
            block_sequence.push(audiotest_trial);
        }
    }

    return block_sequence;
}
