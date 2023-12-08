// ==UserScript==
// @name           Better Training Software - Azum
// @namespace      https://github.com/sstadlberger/BetterTrainingSoftware
// @version        0.1
// @description    Improves the user exerience in Azum
// @description:de Macht die Benutzung von Azum besser
// @author         Stefan Stadlberger
// @homepage       https://github.com/sstadlberger/BetterTrainingSoftware
// @supportURL     https://github.com/sstadlberger/BetterTrainingSoftware/issues
// @match          https://training.azum.com/users/*/plan_daily*
// @match          https://training.azum.com/users/*/plan*
// @grant          none
// ==/UserScript==

(function() {
    'use strict';

    var trainings = parseDays();
    console.log(trainings);
    beautifyStatusButtons();
    betterWorkoutInfo();

    /**
     * adds precise workout infos to each workout
     */
    function betterWorkoutInfo () {
        for (var day of trainings) {
            for (var workout of day.workouts) {

                var durationAvg = moment.duration(workout.durationSecondsAvg, 'seconds');
                var durationMin = moment.duration(workout.durationSecondsMin, 'seconds');
                var durationMax = moment.duration(workout.durationSecondsMax, 'seconds');
                
                if (workout.lengthMetersAvg > 0) {
                    var distanceBox = document.createElement('span');
                    distanceBox.className = 'badge badge-secondary';
                    distanceBox.style.float = 'right';
                    distanceBox.style.marginLeft = '6px';
                    distanceBox.style.backgroundColor = '#afca0b';
                    distanceBox.innerHTML = '<i class="fa fa-arrows-h"></i> ' + (Math.round(workout.lengthMetersAvg / 100) / 10).toLocaleString() + ' km';
                    var distanceBoxHTML = '';
                    distanceBoxHTML += '<i class="fa fa-arrows-h"></i> ';
                    distanceBoxHTML += (Math.round(workout.lengthMetersAvg / 100) / 10).toLocaleString();
                    distanceBoxHTML += ' km<span style="font-weight: 500;">';
                    if (workout.lengthMetersMin != workout.lengthMetersMax) {
                        distanceBoxHTML += ' <span style="font-size: 0.8em">(';
                        distanceBoxHTML += (Math.round(workout.lengthMetersMin / 100) / 10).toLocaleString() + '-';
                        distanceBoxHTML += (Math.round(workout.lengthMetersMax / 100) / 10).toLocaleString() + ' km';
                        distanceBoxHTML += '</span>)';
                    }
                    distanceBoxHTML += '</span>';
                    distanceBox.innerHTML = distanceBoxHTML

                    document.getElementById('H3-' + workout.workoutID).appendChild(distanceBox);
                }
                if (workout.durationSecondsAvg > 0) {
                    var durationBox = document.createElement('span');
                    durationBox.className = 'badge badge-secondary';
                    durationBox.style.float = 'right';
                    durationBox.style.marginLeft = '6px';
                    durationBox.style.backgroundColor = '#afca0b';
                    var durationBoxHTML = '';
                    durationBoxHTML += '<i class="fa fa-clock-o"></i> ';
                    durationBoxHTML += durationAvg.hours() + ':' + durationAvg.minutes().toString().padStart(2, '0');
                    durationBoxHTML += ' h<span style="font-weight: 500;">';
                    if (workout.durationSecondsMin != workout.durationSecondsMax) {
                        durationBoxHTML += ' <span style="font-size: 0.8em">(';
                        durationBoxHTML += durationMin.hours() + ':' + durationMin.minutes().toString().padStart(2, '0') + '-';
                        durationBoxHTML += durationMax.hours() + ':' + durationMax.minutes().toString().padStart(2, '0') + ' h';
                        durationBoxHTML += '</span>)';
                    }
                    durationBoxHTML += '</span>';
                    durationBox.innerHTML = durationBoxHTML
                    document.getElementById('H3-' + workout.workoutID).appendChild(durationBox);
                }


            }
        }
    }


    /**
     * removes the double border between the status buttons and removes the info icon for prettier alignment
     */
    function beautifyStatusButtons () {
        for (var box of document.querySelectorAll('div.training-title + div > div > div')) {
            for (var statusElement of box.children) {
                // make the borders more even
                if (statusElement.classList.contains("rounded-left")) {
                    statusElement.style.borderRight = "none"
                }
                if (statusElement.classList.contains("rounded-right")) {
                    statusElement.style.borderLeft = "none"
                }
                // I don't need it, so delete it for nicer button alignment
                if (statusElement.nodeName == "I") {
                    statusElement.remove()
                }
            }
        }
    }


    /**
     * Parses all days in a workout view
     * Days are defined as each element that has a date
     * @returns {Array} - an Array that contains Objects with basic information for each day and all workouts for that day as an array
     */
    function parseDays () {

        var trainings = [];

        for (var training of document.getElementsByClassName('next-training-block')) {
            var trainingData = {
                'workouts': [],
                'name': '',
                'date': undefined,
                'dateFormatted': '', // just so that it's easier to read during development
                'dayID': 'dayID-' + trainings.length,
                'durationSecondsMin': 0,
                'durationSecondsMax': 0,
                'durationSecondsAvg': 0,
                'lengthMetersMin': 0,
                'lengthMetersMax': 0,
                'lengthMetersAvg': 0,
            };

            // get training name
            // this is the name given by the trainer
            var trainingTitles = training.getElementsByClassName('training-title');
            if (trainingTitles.length > 0) {
                var trainingNames = trainingTitles[0].nextElementSibling.getElementsByTagName('h3');
                if (trainingNames.length > 0) {
                    trainingData.name = trainingNames[0].textContent;
                }
            }

            // get training date
            if (training.getElementsByClassName('training-date').length > 0) {
                var dateText = training.getElementsByClassName('training-date')[0].textContent.match(/\d\d\.\d\d\.\d\d\d\d/)[0];
                trainingData.date = moment(dateText, "DD.MM.YYYY");
                trainingData.dateFormatted = trainingData.date.format('YYYY-MM-DD');
            }

            // iterate over workout sets; a workout set can consists of multiple, separate workouts
            // a separate workout is assumed when the workout type changes in a block
            trainingData.workouts = getWorkoutsPerDay(training, trainings.length);

            // sum up all training infos
            for (var workout of trainingData.workouts) {
                trainingData.durationSecondsMin += workout.durationSecondsMin;
                trainingData.durationSecondsMax += workout.durationSecondsMax;
                trainingData.durationSecondsAvg += workout.durationSecondsAvg;
                trainingData.lengthMetersMin += workout.lengthMetersMin;
                trainingData.lengthMetersMax += workout.lengthMetersMax;
                trainingData.lengthMetersAvg += workout.lengthMetersAvg;
            }

            trainings.push(trainingData);
        }

        return trainings;

    }


    /**
     * Iterates over all all lines in a day
     * extracts all workouts from them and groups them appropriately
     * @param {HTMLCollection} training - a child of a 'next-training-block'
     * @param {Number} day - the number of the current day element to create unique IDs
     * @returns {Array} - an Array of Arrays where each array is one workout
     */
    function getWorkoutsPerDay (training, day) {

        var workouts = [];

        for (var step of training.children) {

            // get training type from icon
            const trainingTypeIcons = {
                'icon-running1': 'run',
                'icon-cycling2': 'bike',
                'icon-swimming1': 'swim',
            }
            for (var icon of step.getElementsByClassName('icon')) {
                for (var iconType of icon.classList) {
                    if (iconType in trainingTypeIcons) {
                        var workoutID = 'dayID-' + day + '-workoutID-' + workouts.length;
                        workouts.push({
                            'type': trainingTypeIcons[iconType],
                            'durationSecondsMin': 0,
                            'durationSecondsMax': 0,
                            'durationSecondsAvg': 0,
                            'lengthMetersMin': 0,
                            'lengthMetersMax': 0,
                            'lengthMetersAvg': 0,
                            'workoutID': workoutID,
                            steps: [],
                        });
                        icon.parentElement.id = 'H3-' + workoutID;
                    }
                }
            }

            var row = step.lastElementChild.previousElementSibling;
            var repeat = 1;

            if (row) {

                if (row.getElementsByClassName('repeat').length > 0) {
                    repeat = parseInt(row.getElementsByClassName('repeat')[0].textContent.replace(/[^0-9]/g, ''));
                }

                for (var i = 0; i<repeat; i++) {

                    var allUnits = row.getElementsByClassName('col-flex-sm-unit');
                    var allPaces = row.getElementsByClassName('col-flex-sm-pace');
                    if (allUnits.length > 0 && allUnits.length == allPaces.length) {

                        for (var j = 0; j < allUnits.length; j++) {

                            // segment length
                            var units = allUnits[j].textContent.trim()
                            units = units.replace(/\s/g, '');
                            var length = 0;
                            var lengthUnit = '';
                            // split into multiple number/unit pairs (required for things like "3h 30min")
                            for (var thisSegment of units.match(/(\d|\.|,)+(\D)+/g)) {
                                // split in number and unit
                                var parts = thisSegment.match(/(((\d|\.|,)+)|((\D)+))/g);
                                var number = parts[0];
                                // just in case the numbers are suddenly formatted correctly for the locale
                                number = number.replace(',', '.');
                                number = parseFloat(number);
                                var unit = parts[1];
                                switch (unit) {
                                    case 'h':
                                        length += (number * 60 * 60);
                                        lengthUnit = 's';
                                        break;
                                    case 'min':
                                        length += (number * 60);
                                        lengthUnit = 's';
                                        break;
                                    case 'km':
                                        length += (number * 1000);
                                        lengthUnit = 'm';
                                        break;
                                    case 'm':
                                        length += number;
                                        lengthUnit = 'm';
                                        break;
                                }
                            }

                            // segment pace
                            var pace = allPaces[j].textContent.trim().replace(/\n.*/g, '');
                            pace = pace.replace('/ ', '');
                            var paceElements = pace.split(' ');
                            var effortMin = 0;
                            var effortMax = 0;
                            var effortAvg = 0;
                            var effortUnit = '';
                            switch (paceElements[1]) {
                                case 'Watt':
                                    effortUnit = 'W'
                                    var watts = paceElements[0].split('-');
                                    effortMin = parseInt(watts[0]);
                                    effortMax = parseInt(watts[1]);
                                    effortAvg = Math.round((effortMin + effortMax) / 2);
                                    break;
                                case 'km':
                                    effortUnit = 's/km'
                                    var times = paceElements[0].split('-');
                                    // yes, this would be a very good place to use a library that supports parsing durations (moment.js doesn't)
                                    // doing it per hand here to keep the script free from external dependencies
                                    // we'll see if it breaks…
                                    var timeSlow = times[0].split(':');
                                    var timeFast = times[1].split(':');
                                    effortMin = (parseInt(timeSlow[0]) * 60) + parseInt(timeSlow[1]);
                                    effortMax = (parseInt(timeFast[0]) * 60) + parseInt(timeFast[1]);
                                    effortAvg = Math.round((effortMin + effortMax) / 2);
                                    break;
                            }

                            if (lengthUnit == 's') {
                                workouts[(workouts.length - 1)].durationSecondsMin += length;
                                workouts[(workouts.length - 1)].durationSecondsMax += length;
                                workouts[(workouts.length - 1)].durationSecondsAvg += length;
                                if (effortUnit == 's/km') {
                                    workouts[(workouts.length - 1)].lengthMetersMin += Math.round((length / effortMin) * 1000);
                                    workouts[(workouts.length - 1)].lengthMetersMax += Math.round((length / effortMax) * 1000);
                                    workouts[(workouts.length - 1)].lengthMetersAvg += Math.round((length / effortAvg) * 1000);
                                }
                            } else if (lengthUnit == 'm') {
                                workouts[(workouts.length - 1)].lengthMetersMin += length;
                                workouts[(workouts.length - 1)].lengthMetersMax += length;
                                workouts[(workouts.length - 1)].lengthMetersAvg += length;
                                if (effortUnit == 's/km') {
                                    workouts[(workouts.length - 1)].durationSecondsMin += Math.round((length / 1000) * effortMin);
                                    workouts[(workouts.length - 1)].durationSecondsMax += Math.round((length / 1000) * effortMax);
                                    workouts[(workouts.length - 1)].durationSecondsAvg += Math.round((length / 1000) * effortAvg);
                                }
                            }

                            workouts[(workouts.length - 1)].steps.push({
                                'length': length,
                                'lengthUnit': lengthUnit,
                                'effortMin': effortMin,
                                'effortMax': effortMax,
                                'effortAvg': effortAvg,
                                'effortUnit': effortUnit,
                            });
                        }
                    }
                }
            }
        }

        return workouts;

    }

})();