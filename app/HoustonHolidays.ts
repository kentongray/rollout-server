import * as moment from 'moment';
// http://www.houstontx.gov/solidwaste/holiday.html
export const HOLIDAYS = [
  '2020-11-11', '2020-11-26', '2020-11-26', '2020-12-24', '2020-12-25', '2020-01-01', '2020-01-02'
].map((d) => moment(d, ' "YYYY-MM-DD"'));
