// All provider integrations are intentionally mocked and server-side.
export const maps={mode:'mock',getETA:async(minutes)=>({minutes,source:'technician-entered demo',live:false})};
export const payments={mode:'mock',verifyEvent:async()=>{throw new Error('Live payment webhooks are not enabled');}};
export const notifications={mode:'mock',send:async()=>({sent:false,reason:'No SMS or push provider connected'})};
