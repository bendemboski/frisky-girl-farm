import { helper } from '@ember/component/helper';

export function mondayDate([date]: [Date]) {
  let d = new Date(date);
  let day = d.getDay();
  let dayDelta;
  if (day === 0) {
    // sunday
    dayDelta = 6;
  } else {
    dayDelta = day - 1;
  }

  let monday = new Date(d.setDate(d.getDate() - dayDelta));
  return `${monday.getMonth() - 1}-${monday.getDate()}`;
}

export default helper(mondayDate);
