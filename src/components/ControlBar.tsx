import { Play, Pause, Square, Circle, RotateCcw, MessageSquare, Star } from 'lucide-react';
import { useTheaterStore } from '@/store';
import { cn } from '@/lib/utils';

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
}

export default function ControlBar() {
  const {
    playbackState,
    currentTime,
    editorMode,
    project,
    recordedFrames,
    setPlaybackState,
    setCurrentTime,
    clearRecordedFrames,
    addFailureReplay,
    setShowReviewModal,
  } = useTheaterStore();

  const isPlaying = playbackState === 'playing' || playbackState === 'recording';
  const isRecording = playbackState === 'recording';

  const handlePlay = () => {
    if (playbackState === 'idle' || playbackState === 'paused') {
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      setPlaybackState('paused');
    } else if (playbackState === 'recording') {
      setPlaybackState('paused');
    }
  };

  const handleStop = () => {
    setPlaybackState('idle');
    setCurrentTime(0);
  };

  const handleRecord = () => {
    if (playbackState === 'recording') {
      setPlaybackState('idle');
    } else {
      clearRecordedFrames();
      setCurrentTime(0);
      setPlaybackState('recording');
    }
  };

  const handleReset = () => {
    setPlaybackState('idle');
    setCurrentTime(0);
    clearRecordedFrames();
  };

  const handleMarkFailure = () => {
    const reason = prompt('请输入失败原因：', '表演效果未达到预期');
    if (reason !== null) {
      addFailureReplay(reason || '未说明原因', project.elements);
      setPlaybackState('idle');
      alert('失败回放已保存！');
    }
  };

  return (
    <footer className="wood-bg h-20 border-t-2 border-theater-brass relative z-20">
      <div className="h-full flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            disabled={editorMode === 'edit' && project.elements.length === 0}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all brass-btn',
              isPlaying && 'bg-gradient-to-br from-theater-electric to-blue-600 text-white'
            )}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleStop}
            disabled={playbackState === 'idle'}
            className="w-10 h-10 rounded-full flex items-center justify-center brass-btn disabled:opacity-50"
            title="停止"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full flex items-center justify-center brass-btn"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-10 bg-theater-wood-light mx-1" />

          <button
            onClick={handleRecord}
            disabled={editorMode === 'edit'}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all border-2',
              isRecording
                ? 'bg-red-600 border-red-400 text-white animate-pulse'
                : 'brass-btn disabled:opacity-50'
            )}
            title={isRecording ? '停止录制' : '开始录制'}
          >
            <Circle className={cn('w-4 h-4', isRecording && 'fill-current')} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-theater-parchment/60 w-24 text-right font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-2 bg-theater-dark/60 rounded-full overflow-hidden border border-theater-wood-light">
              <div
                className="h-full bg-gradient-to-r from-theater-brass to-theater-brass-light transition-all duration-100"
                style={{ width: `${Math.min(100, (currentTime / 30000) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-theater-parchment/60 w-24 font-mono">
              {formatTime(30000)}
            </span>
          </div>
          <div className="flex items-center justify-between px-28">
            <div className="flex items-center gap-1">
              {isRecording && (
                <>
                  <div className="recording-dot" />
                  <span className="text-xs text-red-400 font-medium">录制中</span>
                  <span className="text-xs text-theater-parchment/50 ml-2">
                    {recordedFrames.length} 帧
                  </span>
                </>
              )}
              {!isRecording && recordedFrames.length > 0 && (
                <span className="text-xs text-theater-parchment/50">
                  已录制 {recordedFrames.length} 帧
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-theater-parchment/50">
              <span>元素: {project.elements.length}</span>
              <span>序列: {project.sequences.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editorMode === 'perform' && (
            <>
              <button
                onClick={handleMarkFailure}
                disabled={playbackState === 'idle'}
                className="brass-btn px-3 py-2 rounded-md text-sm flex items-center gap-1.5 disabled:opacity-50"
                title="标记失败并保存回放"
              >
                <RotateCcw className="w-4 h-4" />
                失败记录
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="brass-btn px-3 py-2 rounded-md text-sm flex items-center gap-1.5"
                title="观众评价"
              >
                <Star className="w-4 h-4" />
                评价
              </button>
            </>
          )}
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center brass-btn"
            title="查看评价"
          >
            <MessageSquare className="w-4 h-4" />
            {project.reviews.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                {project.reviews.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
