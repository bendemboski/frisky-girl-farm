import { helper } from '@ember/component/helper';

interface MondayDateSignature {
  Args: { Positional: [Date] };
  Return: string;
}

const mondayDate = helper<MondayDateSignature>(([date]: [Date]) => {
  let d = new Date(date);
  let day = d.getDay();
  let dayDelta;
  if (day === 0) {
    // sunday, which we think of as at the end of the week-starting-on-monday,
    // so we need to subtract six days from the date to get back to the sunday
    dayDelta = 6;
  } else {
    // not a sunday, so subtract one less than the day value to get back to the
    // monday (which has a value of 1)
    dayDelta = day - 1;
  }

  let monday = new Date(d.setDate(d.getDate() - dayDelta));
  // getMonth() is 0-based, getDate() isn't
  return `${monday.getMonth() + 1}-${monday.getDate()}`;
});

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'monday-date': typeof mondayDate;
  }
}

export default mondayDate;
