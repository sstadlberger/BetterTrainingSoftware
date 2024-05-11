// ==UserScript==
// @name           Better Training Software - Azum
// @namespace      https://github.com/sstadlberger/BetterTrainingSoftware
// @version        0.2
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

    // if the URL param "BTS-A-download-navigate" is present, it will navigate to a plane page
    // where it will download a JSON of the last two weeks and next two months for external processing
    //
    // In my use case I added a bookmark with the URL "https://training.azum.com/users/XXXX/plan/?BTS-A-download-navigate"
    // to have a one-click-access to the JSON
    var doNavigate = new URLSearchParams(window.location.search).get('BTS-A-download-navigate');
    if (doNavigate !== null) {
        var userID = window.location.href.match(/https:\/\/training.azum.com\/users\/(\d{1,6})/);
        if (userID && userID.length == 2) {
            var redirectUrl = 'https://training.azum.com/users/' + userID[1] + '/plan/?';
            redirectUrl += 'since=' + moment().subtract(2, 'weeks').format('YYYY-MM-DD');
            redirectUrl += '&until=' + moment().add(2, 'months').format('YYYY-MM-DD');
            redirectUrl += '&BTS-A-download-download';
            window.location.href = redirectUrl;
        }
    }

    var trainings = parseDays();
    beautifyStatusButtons();
    betterWorkoutInfo(trainings);

    var doDownload = new URLSearchParams(window.location.search).get('BTS-A-download-download');
    if (doDownload !== null) {
        downloadWorkouts(trainings);
    }

    /**
     * adds precise workout infos to each workout
     * @param {Array} trainings - an array containing all workouts, the same structure as the return from parseDays()
     */
    function betterWorkoutInfo (trainings) {
        for (var day of trainings) {
            // modify the main boxes with the correct content

            // duration box
            if (day.durationSecondsAvg > 0) {
                var durationAvg = moment.duration(day.durationSecondsAvg, 'seconds');
                var durationMin = moment.duration(day.durationSecondsMin, 'seconds');
                var durationMax = moment.duration(day.durationSecondsMax, 'seconds');
                var durationBox = document.getElementById('TIME-' + day.dayID);
                if (!durationBox) {
                    var newBox = document.createElement('span');
                    document.getElementById('LABELBOX-' + day.dayID).prepend(newBox);
                    newBox.outerHTML = ' <span title="Zeit" class="badge badge-secondary" id="TIME-' + day.dayID + '"><i class="fa fa-clock-o"></i>Xh XXmin</span> ';
                    durationBox = document.getElementById('TIME-' + day.dayID);
                }
                durationBox.style.backgroundColor = '#000000';
                var durationBoxHTML = '';
                durationBoxHTML += '<i class="fa fa-clock-o"></i> ';
                durationBoxHTML += durationAvg.hours() + ':' + durationAvg.minutes().toString().padStart(2, '0');
                durationBoxHTML += ' h<span style="font-weight: 500;">';
                if (day.durationSecondsMin != day.durationSecondsMax) {
                    durationBoxHTML += ' <span style="font-size: 0.8em">(';
                    durationBoxHTML += durationMin.hours() + ':' + durationMin.minutes().toString().padStart(2, '0') + '-';
                    durationBoxHTML += durationMax.hours() + ':' + durationMax.minutes().toString().padStart(2, '0') + ' h';
                    durationBoxHTML += '</span>)';
                }
                durationBoxHTML += '</span>';
                durationBox.innerHTML = durationBoxHTML

            }
            // distance box
            if (day.lengthMetersAvg > 0) {
                var distanceBox = document.getElementById('DISTANCE-' + day.dayID);
                if (!distanceBox) {
                    var newBox = document.createElement('span');
                    document.getElementById('LABELBOX-' + day.dayID).firstElementChild.after(newBox);
                    newBox.outerHTML = ' <span title="Distanz" class="badge badge-secondary" id="DISTANCE-' + day.dayID + '"><i class="fa fa-arrows-h"></i>X.Xkm</span> ';
                    distanceBox = document.getElementById('DISTANCE-' + day.dayID);
                }
                distanceBox.style.backgroundColor = '#000000';
                var distanceBoxHTML = '';
                distanceBoxHTML += '<i class="fa fa-arrows-h"></i> ';
                distanceBoxHTML += (Math.round(day.lengthMetersAvg / 100) / 10).toLocaleString();
                distanceBoxHTML += ' km<span style="font-weight: 500;">';
                if (day.lengthMetersMin != day.lengthMetersMax) {
                    distanceBoxHTML += ' <span style="font-size: 0.8em">(';
                    distanceBoxHTML += (Math.round(day.lengthMetersMin / 100) / 10).toLocaleString() + '-';
                    distanceBoxHTML += (Math.round(day.lengthMetersMax / 100) / 10).toLocaleString() + ' km';
                    distanceBoxHTML += '</span>)';
                }
                distanceBoxHTML += '</span>';
                distanceBox.innerHTML = distanceBoxHTML;
            }
            // energy box
            var energyBox = document.getElementById('ENERGY-' + day.dayID)
            if (energyBox) {
                energyBox.style.fontWeight = '500';
                energyBox.children[0].style.fontSize = '0.95em';
            }
            // carb box
            var carbBox = document.getElementById('CARBS-' + day.dayID)
            if (carbBox) {
                carbBox.style.fontWeight = '500';
            }
            // fat box
            var fatBox = document.getElementById('FAT-' + day.dayID)
            if (fatBox) {
                fatBox.style.fontWeight = '500';
                fatBox.children[0].style.fontSize = '0.95em';
            }

            for (var workout of day.workouts) {
                // add boxes per workout

                // distance data
                if (workout.lengthMetersAvg > 0) {
                    var distanceBox = document.createElement('span');
                    distanceBox.className = 'badge badge-secondary';
                    distanceBox.style.float = 'right';
                    distanceBox.style.marginLeft = '6px';
                    distanceBox.style.backgroundColor = '#000000 ';
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

                // duration data
                var durationAvg = moment.duration(workout.durationSecondsAvg, 'seconds');
                var durationMin = moment.duration(workout.durationSecondsMin, 'seconds');
                var durationMax = moment.duration(workout.durationSecondsMax, 'seconds');

                if (workout.durationSecondsAvg > 0) {
                    var durationBox = document.createElement('span');
                    durationBox.className = 'badge badge-secondary';
                    durationBox.style.float = 'right';
                    durationBox.style.marginLeft = '6px';
                    durationBox.style.backgroundColor = '#000000';
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

            // tag info boxes for later
            if (training.getElementsByClassName('training-labels').length > 0) {
                training.getElementsByClassName('training-labels')[0].id = 'LABELBOX-' + trainingData.dayID;
                for (var infoBox of training.getElementsByClassName('training-labels')[0].children) {
                    if (infoBox.nodeName == 'SPAN' && infoBox.classList.contains("badge") && infoBox.classList.contains("badge-secondary")) {
                        var infoIcon = infoBox.querySelector('i');
                        if (infoIcon.classList.contains('fa-clock-o')) {
                            infoBox.id = 'TIME-' + trainingData.dayID;
                        } else if (infoIcon.classList.contains('fa-arrows-h')) {
                            infoBox.id = 'DISTANCE-' + trainingData.dayID;
                        } else if (infoIcon.classList.contains('ion-flash')) {
                            infoBox.id = 'ENERGY-' + trainingData.dayID;
                        } else if (infoIcon.classList.contains('icon-carbs')) {
                            infoBox.id = 'CARBS-' + trainingData.dayID;
                        } else if (infoIcon.classList.contains('ion-waterdrop')) {
                            infoBox.id = 'FAT-' + trainingData.dayID;
                        }
                    }
                }
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
                                    case 's':
                                        length += number;
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

                            // fix some layout issues
                            allPaces[j].style.maxWidth = '140px'; // I always have an additional line break because the field is to narrow
                            allPaces[j].style.textAlign = 'right'; // numbers are always aligned right
                            allPaces[j].innerHTML = allPaces[j].textContent.trim().replace(/\n.*/g, ''); // I don't need the secondary info and it makes the other numbers more difficult to read; this is a personal preference


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

    /**
     * Downloads all workouts as JSON for further processing
     * @param {Array} trainings - an array containing all workouts, the same structure as the return from parseDays()
     */
    function downloadWorkouts (trainings) {

        if (trainings.length > 0) {

            // get the date range of all trainings
            var maxDate;
            var minDate;
            for (var day of trainings) {
                // initialize min and max dates to proper moment objects
                if (!moment.isMoment(maxDate)) {
                    maxDate = moment(day.date);
                }
                if (!moment.isMoment(maxDate)) {
                    minDate = moment(day.date);
                }

                // set min/max dates accordingly
                if (day.date.isAfter(minDate)) {
                    maxDate = moment(day.date);
                }
                if (day.date.isBefore(minDate)) {
                    minDate = moment(day.date);
                }
            }

            // export as file
            var data = JSON.stringify(trainings, undefined, 4);
            data += "\n";

            var fileName = 'Trainings ';
            fileName += minDate.format('YYYY-MM-DD');
            fileName += ' to ';
            fileName += maxDate.format('YYYY-MM-DD');
            fileName += '.json';

            var downloadElement = document.createElement('a');
            downloadElement.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
            downloadElement.setAttribute('download', fileName);
            downloadElement.style.display = 'none';
            document.body.appendChild(downloadElement);
            downloadElement.click();
            document.body.removeChild(downloadElement);

        }
    }

})();
