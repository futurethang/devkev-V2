// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";
var projects = defineCollection({
  name: "projects",
  directory: "content/projects",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    tags: z.array(z.string()),
    aiAssisted: z.boolean().optional().default(false),
    buildTime: z.string().optional(),
    liveUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    featured: z.boolean().optional().default(false),
    coverImage: z.string().optional(),
    mock: z.boolean().optional().default(false)
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);
    return {
      ...document,
      mdx,
      url: `/projects/${document._meta.path}`,
      slug: document._meta.path,
      _id: document._meta.filePath,
      _raw: {
        sourceFilePath: document._meta.filePath,
        sourceFileName: document._meta.fileName,
        sourceFileDir: document._meta.directory,
        flattenedPath: document._meta.path,
        contentType: "mdx"
      }
    };
  }
});
var posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    tags: z.array(z.string()),
    published: z.boolean().optional().default(true),
    coverImage: z.string().optional(),
    mock: z.boolean().optional().default(false)
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);
    return {
      ...document,
      mdx,
      url: `/blog/${document._meta.path}`,
      slug: document._meta.path,
      _id: document._meta.filePath,
      _raw: {
        sourceFilePath: document._meta.filePath,
        sourceFileName: document._meta.fileName,
        sourceFileDir: document._meta.directory,
        flattenedPath: document._meta.path,
        contentType: "mdx"
      }
    };
  }
});
var experiments = defineCollection({
  name: "experiments",
  directory: "content/experiments",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    tags: z.array(z.string()),
    demoUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
    buildPrompt: z.string().optional(),
    mock: z.boolean().optional().default(false)
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);
    return {
      ...document,
      mdx,
      url: `/lab/${document._meta.path}`,
      slug: document._meta.path,
      _id: document._meta.filePath,
      _raw: {
        sourceFilePath: document._meta.filePath,
        sourceFileName: document._meta.fileName,
        sourceFileDir: document._meta.directory,
        flattenedPath: document._meta.path,
        contentType: "mdx"
      }
    };
  }
});
var content_collections_default = defineConfig({
  collections: [projects, posts, experiments]
});
export {
  content_collections_default as default
};
