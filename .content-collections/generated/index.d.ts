import configuration from "../../content-collections.ts";
import { GetTypeByName } from "@content-collections/core";

export type Project = GetTypeByName<typeof configuration, "projects">;
export declare const allProjects: Array<Project>;

export type Post = GetTypeByName<typeof configuration, "posts">;
export declare const allPosts: Array<Post>;

export type Experiment = GetTypeByName<typeof configuration, "experiments">;
export declare const allExperiments: Array<Experiment>;

export {};
