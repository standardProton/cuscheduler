export const example_schedule = {
    classes:[
        {
            meeting_times: [
                {day: 0, start_time: 0, end_time: 10},
                {day: 2, start_time: 0, end_time: 10}
            ],
            title: "CSCI 3308",
            type: "LEC",
            section: "012",
        },
        {
            meeting_times: [
                {day: 3, start_time: 45, end_time: 65}
            ],
            title: "CSCI 3308",
            type: "REC",
            section: "432"
        },
        {
            meeting_times: [
                {day: 0, start_time: 13, end_time: 36},
                {day: 2, start_time: 24, end_time: 48},
                {day: 4, start_time: 36, end_time: 60}
            ],
            title: "CSCI 2824",
            type: "LEC",
            section: "014"
        },
        {
            meeting_times: [
                {day: 1, start_time: 100, end_time: 120},
            ],
            title: "BUSM 2011",
            type: "REC",
            section: "456"
        }
    ],
    avoid_times: [
        [], [], [], [], [] //[[0, 12]], [[0, 12]], [[0, 12]], [[0, 12]], [[0, 12]]
    ],
}

export const example_schedule2 = {
    classes:[
        {
            meeting_times: [
                {day: 3, start_time: 45, end_time: 65}
            ],
            title: "CSCI 3308",
            type: "REC",
            section: "432"
        },
        {
            meeting_times: [
                {day: 0, start_time: 0, end_time: 10},
                {day: 2, start_time: 0, end_time: 10}
            ],
            title: "CSCI 3308",
            type: "LEC",
            section: "012",
        },
        {
            meeting_times: [
                {day: 0, start_time: 13, end_time: 36},
                {day: 2, start_time: 24, end_time: 48},
                {day: 4, start_time: 36, end_time: 60}
            ],
            title: "CSCI 2824",
            type: "LEC",
            section: "014"
        },
        {
            meeting_times: [
                {day: 1, start_time: 100, end_time: 120},
            ],
            title: "BUSM 2011",
            type: "REC",
            section: "456"
        }
    ],
    avoid_times: [
        [], [], [], [], [] //[[0, 12]], [[0, 12]], [[0, 12]], [[0, 12]], [[0, 12]]
    ],
}