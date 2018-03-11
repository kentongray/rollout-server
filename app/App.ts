'use strict';

import {start} from "./RolloutServer";

start().catch((e) => {
  console.error('Error Starting Server', e)
});