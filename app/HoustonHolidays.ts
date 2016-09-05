import * as moment from 'moment';

export const HOLIDAYS = ['2015-11-11', '2015-11-12', '2015-11-27', '2015-11-28',
  '2015-12-24', '2015-12-25', '2015-12-26',
  '2015-01-01', '2015-01-02'].map((d)=>moment(d, ' "YYYY-MM-DD"'));