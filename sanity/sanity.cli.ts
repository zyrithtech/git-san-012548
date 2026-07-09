import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'umvfvgt9',
    dataset: 'production'
  },
  studioHost: 'zyrithtech',
  deployment: {
    appId: 'q7zj09xlg5n5br5qwpmugwfu',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})
