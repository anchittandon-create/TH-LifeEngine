import yogaFlowsData from './yogaFlows.json';

export interface YogaFlow {
  id: string;
  name: string;
  duration: number;
  type: string;
}

export const YOGA_FLOWS: YogaFlow[] = yogaFlowsData as YogaFlow[];

export function getYogaFlowById(id: string): YogaFlow | undefined {
  return YOGA_FLOWS.find(flow => flow.id === id);
}

export function getYogaFlowsByDuration(maxDuration: number): YogaFlow[] {
  return YOGA_FLOWS.filter(flow => flow.duration <= maxDuration);
}