import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Project = defineDocumentType(() => ({
  name: 'Project',
  filePathPattern: `projects/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: true },
    aiAssisted: { type: 'boolean', required: false, default: false },
    buildTime: { type: 'string', required: false },
    liveUrl: { type: 'string', required: false },
    githubUrl: { type: 'string', required: false },
    featured: { type: 'boolean', required: false, default: false },
    coverImage: { type: 'string', required: false },
    mock: { type: 'boolean', required: false, default: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (project) => `/projects/${project._raw.flattenedPath.replace('projects/', '')}`,
    },
    slug: {
      type: 'string',
      resolve: (project) => project._raw.flattenedPath.replace('projects/', ''),
    },
  },
}))

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: true },
    published: { type: 'boolean', required: false, default: true },
    coverImage: { type: 'string', required: false },
    mock: { type: 'boolean', required: false, default: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/blog/${post._raw.flattenedPath.replace('posts/', '')}`,
    },
    slug: {
      type: 'string',
      resolve: (post) => post._raw.flattenedPath.replace('posts/', ''),
    },
  },
}))

export const Experiment = defineDocumentType(() => ({
  name: 'Experiment',
  filePathPattern: `experiments/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: true },
    demoUrl: { type: 'string', required: false },
    sourceUrl: { type: 'string', required: false },
    buildPrompt: { type: 'string', required: false },
    mock: { type: 'boolean', required: false, default: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (experiment) => `/lab/${experiment._raw.flattenedPath.replace('experiments/', '')}`,
    },
    slug: {
      type: 'string',
      resolve: (experiment) => experiment._raw.flattenedPath.replace('experiments/', ''),
    },
  },
}))

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Project, Post, Experiment],
})