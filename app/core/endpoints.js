module.exports = {
    apiUrl: "https://mt-client-api-v1.london.agiliumtrade.ai",
    accountOrders: (accountId, startTime, endTime) => `https://mt-client-api-v1.london.agiliumtrade.ai/users/current/accounts/${accountId}/history-orders/time/${startTime}/${endTime}`,
    accountInformation: (accountId) => `https://mt-client-api-v1.london.agiliumtrade.ai/users/current/accounts/${accountId}/accountInformation`,
    accountMetrics: (accountId) => `https://metastats-api-v1.london.agiliumtrade.ai/users/current/accounts/${accountId}/metrics`
}
