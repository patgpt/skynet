import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Skynet MCP Server',
  description: 'Advanced Model Context Protocol server with persistent memory',
  base: '/patgpt-mcp/',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Tools Overview', link: '/guide/tools' },
          ]
        },
        {
          text: 'Development',
          items: [
            { text: 'Setup', link: '/guide/setup' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Building', link: '/guide/building' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Infrastructure Tools', link: '/api/infrastructure' },
            { text: 'Database Tools', link: '/api/database' },
            { text: 'Memory Tools', link: '/api/memory' },
            { text: 'Interaction Tools', link: '/api/interactions' },
            { text: 'Cognitive Tools', link: '/api/cognitive' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/patgpt/patgpt-mcp' }
    ],

    footer: {
      message: 'Built with Bun + FastMCP + TypeScript',
    }
  }
})
