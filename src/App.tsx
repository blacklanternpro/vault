import { Layout } from './components/Layout';
import { AsciiRule } from './components/tui/AsciiRule';
import { VaultPlate } from './components/tui/VaultPlate';
import { IndexPanel } from './components/tui/IndexPanel';
import { Zone } from './components/tui/Zone';
import { CalendarList } from './components/tui/CalendarList';
import { TaskList } from './components/tui/TaskList';
import { NotesTerminal } from './components/tui/NotesTerminal';
import { CALENDAR_ENTRIES, TASK_ITEMS } from './data/tui';

function App() {
  const openTasks = TASK_ITEMS.filter((task) => task.status !== 'DONE').length;

  return (
    <Layout vault={<VaultPlate />} index={<IndexPanel />}>
      <Zone
        index="01"
        title="Calendar"
        meta={`${CALENDAR_ENTRIES.length} SCHEDULED`}
      >
        <CalendarList />
      </Zone>

      <AsciiRule
        char="*"
        className="px-0 text-[9px] leading-none text-ink/50 sm:text-[10px]"
      />

      <Zone index="02" title="Extended Tasks" meta={`${openTasks} OPEN`}>
        <TaskList />
      </Zone>

      <AsciiRule
        char="*"
        className="px-0 text-[9px] leading-none text-ink/50 sm:text-[10px]"
      />

      <Zone index="03" title="Notes" meta="LOG_STREAM" bleed>
        <NotesTerminal />
      </Zone>
    </Layout>
  );
}

export default App;
