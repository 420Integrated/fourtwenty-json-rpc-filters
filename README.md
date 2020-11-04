# fourtwenty-json-rpc-filters

[json-rpc-engine](https://github.com/kumavis/json-rpc-engine) middleware implementing 420coin filter methods.
Backed by an [fourtwenty-block-tracker](https://github.com/420integrated/fourtwenty-block-tracker) and web3 provider interface (`web3.currentProvider`).

### supported rpc methods
- `fourtwenty_newFilter`
- `fourtwenty_newBlockFilter`
- `fourtwenty_newPendingTransactionFilter`
- `fourtwenty_uninstallFilter`
- `fourtwenty_getFilterChanges`
- `fourtwenty_getFilterLogs`

### usage

basic usage:
```js
const filterMiddleware = createFilterMiddleware({ blockTracker, provider })
engine.push(filterMiddleware)
```

cleanup:
```js
// remove blockTracker handler to free middleware for garbage collection
filterMiddleware.destroy()
```

### Changelog

##### 2.0

- expect FourtwentyBlockTracker@4
