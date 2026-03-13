import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { dummyProjectContracts, dummyContractFiles, type ProjectContract, type ContractFile } from "@/data/dummy-contracts";
import { cloneProjectContract, recalculateProjectContract } from "@/lib/project-contracts";

interface ProjectContextValue {
  projects: ProjectContract[];
  files: ContractFile[];
  updateProject: (updated: ProjectContract) => void;
  addProject: (project: ProjectContract) => void;
  upsertProjects: (incoming: ProjectContract[]) => void;
  deleteFile: (fileId: string) => void;
  addFile: (file: ContractFile) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectContract[]>(() =>
    dummyProjectContracts.map((p) => recalculateProjectContract(p))
  );
  const [files, setFiles] = useState<ContractFile[]>(() =>
    dummyContractFiles.filter((f) => f.contract_type === "project").map((f) => ({ ...f }))
  );

  const updateProject = useCallback((updated: ProjectContract) => {
    setProjects((prev) => prev.map((project) => (project.id === updated.id ? recalculateProjectContract(updated, project) : project)));
  }, []);

  const addProject = useCallback((project: ProjectContract) => {
    setProjects((prev) => [recalculateProjectContract(project), ...prev]);
  }, []);

  const upsertProjects = useCallback((incoming: ProjectContract[]) => {
    if (incoming.length === 0) return;
    setProjects((prev) => {
      const next = prev.map(cloneProjectContract);
      incoming.forEach((project) => {
        const recalculated = recalculateProjectContract(project);
        const index = next.findIndex(
          (item) => item.id === recalculated.id || item.contract_number === recalculated.contract_number
        );
        if (index >= 0) next[index] = recalculated;
        else next.unshift(recalculated);
      });
      return next;
    });
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const addFile = useCallback((file: ContractFile) => {
    setFiles((prev) => [...prev, file]);
  }, []);

  return <ProjectContext.Provider value={{ projects, files, updateProject, addProject, upsertProjects, deleteFile, addFile }}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectProvider");
  return ctx;
}
