import TopBar from '@/components/TopBar';
import Toolbar from '@/components/Toolbar';
import StageCanvas from '@/components/StageCanvas';
import PropertyPanel from '@/components/PropertyPanel';
import ControlBar from '@/components/ControlBar';
import ReviewModal from '@/components/ReviewModal';
import ProjectManager from '@/components/ProjectManager';
import FailureReplayModal from '@/components/FailureReplayModal';

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-theater-dark overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <Toolbar />
        <StageCanvas />
        <PropertyPanel />
      </div>
      <ControlBar />
      <ReviewModal />
      <ProjectManager />
      <FailureReplayModal />
    </div>
  );
}
