Qualtrics.SurveyEngine.addOnload(function () {

    /*Place your JavaScript here to run when the page loads*/

    /* PLEASE CHECK:
        TO RUN THIS SCRIPT PROPERLY, THE EMBEDDED VARIABLES 
            aggregated data: *** bonus, click_cnt, finished_trial_cnt, provoked_cnt, kill_cnt ***
            trial-level data *** planned_trial, wasted_click_history, trial_data *** (redundant)
        MUST BE DEFINED.
    /*

    /* Change 1: Hiding the Next button */
    // Retrieve Qualtrics object and save in qthis
    var qthis = this;

    // Hide buttons
    qthis.hideNextButton();

    /* Change 2: Defining and loading required resources */
    // `requiredResources` must include all the required JS files
    var task_github = "https://kywch.github.io/RC-RAGE_jsPsych/"; // https://<your-github-username>.github.io/<your-experiment-name>
    var requiredResources = [
        task_github + "lib/jspsych-6.1.0/jspsych.js",
        task_github + "lib/jspsych-6.1.0/plugins/jspsych-fullscreen.js",
        task_github + "lib/jspsych-6.1.0/plugins/jspsych-instructions.js",
        task_github + "lib/jspsych-6.1.0/plugins/jspsych-html-keyboard-response.js",
        task_github + "lib/jspsych-audio-keyboard-with-replay.js",
        task_github + "lib/jspsych-rc-rage.js",
        task_github + "lib/rc-rage_main.js"
    ];

    function loadScript(idx) {
        console.log("Loading ", requiredResources[idx]);
        jQuery.getScript(requiredResources[idx], function () {
            if ((idx + 1) < requiredResources.length) {
                loadScript(idx + 1);
            } else {
                initExp();
            }
        });
    }

    if (window.Qualtrics && (!window.frameElement || window.frameElement.id !== "mobile-preview-view")) {
        loadScript(0);
    }

    /* Change 3: Appending the display_stage Div using jQuery */
    // jQuery is loaded in Qualtrics by default
    jQuery("<div id = 'display_stage_background'></div>").appendTo('body');
    jQuery("<div id = 'display_stage'></div>").appendTo('body');

    /* Change 4: Wrapping jsPsych.init() in a function */
    function initExp() {

        // these are to pre-load instruction images 
        var instr_url = task_github + 'instruction/';
        var instr_imglist = get_instruction_imglist(instr_url, 30);

        // push all the procedures, which are defined in stop-it_main.js to the overall timeline
        var jspsych_session = []; // this array stores the events we want to run in the experiment

        // use the full screen
        jspsych_session.push({
            type: 'fullscreen',
            fullscreen_mode: true
        });

        jspsych_session.push({
            timeline: generate_instruction_block(instr_imglist)
        });

        jspsych_session.push({
            timeline: generate_practice_block()
        });

        jspsych_session.push({
            timeline: generate_main_block()
        });

        // exit the full screen
        jspsych_session.push({
            type: 'fullscreen',
            fullscreen_mode: false
        });

        jsPsych.init({
            display_element: 'display_stage',
            timeline: jspsych_session,
            preload_images: instr_imglist,

            exclusions: { // browser window needs to have these dimensions, if not, participants get the chance to maximize their window, if they don't support this resolution when maximized they can't particiate.
                min_width: 1000,
                min_height: 700
            },

            on_finish: function () {

                /* Change 5: Summarizing and saving the aggregated results */

                // NOTE that main_score, main_seq, click_history, wasted_click_history
                // are all alreday defined in rc-rage_main.js
                // The below lines take advantage of these variables rather than going through the raw data

                // performance-based bonus in dollar (in string)
                let bonus = (main_score / 100).toFixed(2);

                // the trial sequence (specifies when the robber appears)
                let trial_seq = main_seq;
                trial_seq.forEach(function (item, ii) {
                    if (item > 1000) trial_seq[ii] = -1; // robber did not appear
                });
                trial_seq = trial_seq.toString().replace(/,/g, ';');

                // participants' click counts for each trial
                let click_cnt = click_history.reduce(function (a, b) {
                    return (a + b);
                }).toString();

                // completed trials (within the time limit)
                var comp_trial_cnt = wasted_click_history.filter(x => x >= 0).length;

                // the number of trials, in which the robber appeared
                var provoked_cnt = main_seq.slice(0, comp_trial_cnt).filter(x => x > 0).length;

                // the number of trials, in which the robber was killed by retailation
                var kill_cnt = wasted_click_history.filter(x => x > 0).length;

                // save the session-level data to Qualtrics
                Qualtrics.SurveyEngine.setEmbeddedData("bonus", bonus);
                Qualtrics.SurveyEngine.setEmbeddedData("click_cnt", click_cnt);
                Qualtrics.SurveyEngine.setEmbeddedData("finished_trial_cnt", comp_trial_cnt);
                Qualtrics.SurveyEngine.setEmbeddedData("provoked_cnt", provoked_cnt);
                Qualtrics.SurveyEngine.setEmbeddedData("kill_cnt", kill_cnt);

                // the simple trial-level data
                // NOTE that detailed trial-level data are not saved here, but it can be done.                
                Qualtrics.SurveyEngine.setEmbeddedData("planned_trial", trial_seq);
                Qualtrics.SurveyEngine.setEmbeddedData("wasted_click_history", wasted_click_history.toString().replace(/,/g, ';'));


                /* Change 6: Saving the trial-level data and finishing up */
                // save the data
                Qualtrics.SurveyEngine.setEmbeddedData("trial_data", result_string);

                function sleep(time) {
                    return new Promise((resolve) => setTimeout(resolve, time));
                }

                sleep(500).then(() => {
                    saved_string = Qualtrics.SurveyEngine.getEmbeddedData("trial_data");
                    //console.log(saved_string);
                    if (result_string !== saved_string) {
                        console.log('There was a problem with saving data. Trying again...')
                        // try to save it once more, but no guarantee
                        Qualtrics.SurveyEngine.setEmbeddedData("trial_data", result_string);
                    } else {
                        console.log('Save was successful.')
                    }
                });

                sleep(500).then(() => {
                    // clear the stage
                    jQuery('#display_stage').remove();
                    jQuery('#display_stage_background').remove();

                    // simulate click on Qualtrics "next" button, making use of the Qualtrics JS API
                    qthis.clickNextButton();
                });
            }
        });
    }
});

Qualtrics.SurveyEngine.addOnReady(function () {
    /*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /*Place your JavaScript here to run when the page is unloaded*/

});