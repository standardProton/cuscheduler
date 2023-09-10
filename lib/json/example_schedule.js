export const example_schedule = {
    classes:[
        [
        {
            meeting_times: [
                {day: 0, start_time: 0, end_time: 10},
                {day: 2, start_time: 0, end_time: 10}
            ],
            title: "CSCI 3308",
            type: "LEC",
            section: "012",
        }],
        [{
            meeting_times: [
                {day: 0, start_time: 13, end_time: 36},
                {day: 2, start_time: 24, end_time: 48},
                {day: 4, start_time: 36, end_time: 60}
            ],
            title: "CSCI 2824",
            type: "LEC",
            section: "014"
        }],
    ],
    avoid_hours: [
        [], [], [], [], [[84, 120]]
    ],
}