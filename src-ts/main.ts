import bootstrap from './index'

try {
  bootstrap()
} catch (err) {
  console.error(`Sirius2 failed to load: ${String(err)}`)
}

console.log('CPS Tracker initialized successfully!')
