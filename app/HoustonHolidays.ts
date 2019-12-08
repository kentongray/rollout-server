import * as moment from 'moment';
// http://www.houstontx.gov/solidwaste/holiday.html
export const HOLIDAYS = [
  '2019-12-24', '2019-12-25', '2019-12-26','2019-12-31','2020-01-01','2020-01-02'
].map((d) => moment(d, ' "YYYY-MM-DD"'));
