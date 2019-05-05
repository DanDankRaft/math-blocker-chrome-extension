import store from '../store';
import moment from 'moment';

const helpers = {
    isScheduledTurnedOn: () => {return store.getState().schedulingOn},
    isScheduleBlockCurrentlyActive: () => {
        let storeState = store.getState();
        return (storeState.schedulingOn && storeState.schedulingData[moment().weekday()].enabled &&
            moment().isSameOrAfter(moment(storeState.schedulingData[moment().weekday()].startTime, "h:m A")) &&
            moment().isBefore(moment(storeState.schedulingData[moment().weekday()].endTime, "h:m A")))
    },
    doesDayMatchCurrentBlock: (day) => {
        return (day === moment().weekday()) && this.isScheduleBlockCurrentlyActive();
    }
}

export default helpers;