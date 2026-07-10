import { toast } from "sonner";

export function notifyAgentStarted(name: string) {
  toast.success(`Agent ${name} spuštěn`);
}

export function notifyAgentStopped(name: string) {
  toast.info(`Agent ${name} zastaven`);
}

export function notifyAgentPaused(name: string) {
  toast.info(`Agent ${name} pozastaven`);
}

export function notifyAgentResumed(name: string) {
  toast.success(`Agent ${name} obnoven`);
}

export function notifyAgentRestarted(name: string) {
  toast.success(`Agent ${name} restartován`);
}

export function notifyAgentError(name: string, msg: string) {
  toast.error(`Agent ${name}: ${msg}`);
}

export function notifyTaskCompleted(taskTitle: string) {
  toast.success(`Úkol dokončen: ${taskTitle}`);
}

export function notifyTaskFailed(taskTitle: string) {
  toast.error(`Úkol selhal: ${taskTitle}`);
}

export function notifyCalendarSync() {
  toast.success("Kalendář synchronizován");
}

export function notifyEmailSync(count: number) {
  toast.success(`${count} nových e-mailů`);
}

export function notifyConnectionLost() {
  toast.error("Připojení k serveru ztraceno", { duration: Infinity });
}

export function notifyConnectionRestored() {
  toast.success("Připojení obnoveno");
}
