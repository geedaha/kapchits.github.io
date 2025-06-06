import { defineConfig } from 'tinacms';

export default defineConfig({
  branch: process.env.NEXT_PUBLIC_TINA_BRANCH || 'main',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '<CLIENT_ID>',
  token: process.env.TINA_TOKEN || '<WRITE_TOKEN>',
  build: {
    outputFolder: 'out',
    publicFolder: '../public',
    publicPath: '/_tina',
  },
  media: {
    tina: {
      publicFolder: 'static',
      mediaRoot: 'uploads',
    },
  },
  schema: {
    collections: [
      {
        label: 'Videos',
        name: 'videos',
        path: 'content/videos',
        fields: [
          { type: 'string', name: 'title', label: 'Title' },
          { type: 'rich-text', name: 'body', label: 'Body' },
        ],
      },
      {
        label: 'User Agreement',
        name: 'userAgreement',
        path: 'content/user-agreement',
        fields: [
          { type: 'string', name: 'title', label: 'Title' },
          { type: 'rich-text', name: 'body', label: 'Body' },
        ],
      },
      # (добавьте аналогичные блоки для всех нужных разделов: Teaching Materials, Scholars и т. д.)
    ],
  },
});
