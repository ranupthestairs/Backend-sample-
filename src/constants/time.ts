class Time {
    private timeDiff: number;
    constructor() {
        this.timeDiff = 0;
    }
    setTimeDiff = (timeDiff: number) => {
        this.timeDiff = timeDiff;
    };
    getTimeDiff = () => {
        return this.timeDiff;
    };
}

export const time = new Time();
