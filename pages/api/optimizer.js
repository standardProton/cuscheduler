import solver from "javascript-lp-solver/src/solver";


export default async function handler(req, res){
    if (req.method != "POST"){
        res.status(405).json({error_msg: "Must be 'POST' method!"});
        return;
    }

    if (req.body == undefined || req.body == ""){
        res.status(406).json({error_msg: "Missing request body"});
        return;
    }

    var data = null;
    try {
        data = JSON.parse(req.body);
    } catch (ex){
        res.status(406).json({error_msg: "Invalid JSON format for request body"});
        return;
    }

    if (data.current_schedule == undefined || data.preschedule == undefined || data.current_schedule.avoid_times == undefined) {
        res.status(406).json({error_msg: "Body must contain 'current_schedule', 'current_schedule.avoid_times', and 'preschedule'!"});
        return;
    }
    const avoid_times = data.current_schedule.avoid_times, preschedule = data.preschedule;
    if (avoid_times.length != 5){
        res.status(406).json({error_msg: "Malformatted avoid_times: Must have an entry for each day."});
        return;
    }
    let avoid_total = 0;
    for (let i = 0; i < avoid_times.length; i++){
        avoid_total += avoid_times[i].length;
        if (avoid_total > 20){
            res.status(406).json({error_msg: "Exceeded the maximum number of avoid time ranges!"});
            return;
        }
    }
    if (preschedule.length > 20){
        res.status(406).json({error_msg: "Exceeded the maximum number of classes!"});
        return;
    }
    if (preschedule.length == 0){
        res.status(406).json({error_msg: "Preschedule is empty."});
        return;
    }

    const min_enroll_count = data.min_enroll_count == undefined ? preschedule.length : Math.min(data.min_enroll_count, preschedule.length);
    const model = {
        optimize: "cost",
        opType: "min",
        constraints: {
            enrolled_count: {min: min_enroll_count, max: min_enroll_count}
        },
        variables: {},
        ints: {}
    }
    const naming_key = {}
    for (let i = 0; i < preschedule.length; i++){ //each class to be scheduled
        if (preschedule[i].title == undefined || preschedule[i].offerings == undefined || preschedule[i].offerings.length == 0){
            res.status(406).json({error_msg: "Malformatted preschedule object (Index " + i + ")"});
            return;
        }
        const title = preschedule[i].title.toUpperCase();
        if (naming_key[preschedule[i].title] != undefined) {
            res.status(406).json({error_msg: "Duplicate class title: '" + title + "'"});
            return;
        }
        naming_key["c" + i] = title;
        naming_key[title] = i;

        model.constraints["c" + i + "-enrolled"] = {min: 0, max: 1};

        for (let j = 0; j < preschedule[i].offerings.length; j++){ //each offering in class
            const offering = preschedule[i].offerings[j];
            const model_var = {enrolled_count: 1, cost: Math.random()}
            model_var["c" + i + "-enrolled"] = 1;

            if (offering.full) model_var.cost += 100;
            //check unavailable hours here

            if (offering.meeting_times == undefined || offering.meeting_times.length == 0){
                res.status(406).json({error_msg: "Class '" + title + "' offering #" + (j+1) + " does not define 'meeting_times'!"});
                return;
            }

            for (let k = 0; k < offering.meeting_times.length; k++){ //for each time class meets in the week
                const mtime = offering.meeting_times[k];
                
                if (mtime.day == undefined || mtime.day < 0 || mtime.day > 4 || mtime.start_time == undefined || mtime.end_time == undefined || mtime.start_time < 0 || mtime.start_time > 128-1 || mtime.end_time <= mtime.start_time || mtime.end_time > 128){
                    res.status(406).json({error_msg: "Malformatted meeting time in class '" + title + " offering #" + (j+1) + " meeting time #" + (k+1) + "! Check that the day, start_time, and end_time are correct."});
                    return;
                }
                
                for (let time_itr = mtime.start_time; time_itr <= mtime.end_time; time_itr++){ //every 5 min chunk in 1 class's meeting
                    model_var["d" + mtime.day + "-t" + time_itr] = 1; //model time (0-128), also books 5 mins after class ends
                    model.constraints["d" + mtime.day + "-t" + time_itr] = {min: 0, max: 1};
                }
            }

            model.variables["c" + i + "-o" + j] = model_var;
            model.ints["c" + i + "-o" + j] = 1;
        }
    }

    
    //console.log(model);

    //const start = (new Date()).getTime();
    const solved = solver.Solve(model)
    //const duration = (new Date()).getTime() - start;

    console.log(solved);

    const final_schedule = [];
    for (const [var_name, val] of Object.entries(solved)){
        const var_split = var_name.split("-");
        if (var_split.length == 2){ //class result
            const class_num = parseInt(var_split[0].substring(1)), offering_num = parseInt(var_split[1].substring(1));
            const add_class = preschedule[class_num].offerings[offering_num];

            add_class.title = preschedule[class_num].title;
            add_class.type = preschedule[class_num].type;
            final_schedule.push(add_class);
        }
    }

    res.status(200).json(final_schedule);
}