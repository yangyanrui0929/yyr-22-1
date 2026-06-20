import { useState } from 'react';
import { X, Star, Trash2, Play } from 'lucide-react';
import { useTheaterStore } from '@/store';
import { cn } from '@/lib/utils';

export default function ReviewModal() {
  const {
    project,
    showReviewModal,
    setShowReviewModal,
    addReview,
    setShowFailureReplay,
  } = useTheaterStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!showReviewModal) return null;

  const handleSubmit = () => {
    if (comment.trim()) {
      addReview(rating, comment.trim());
      setComment('');
      setRating(5);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const avgRating = project.reviews.length > 0
    ? (project.reviews.reduce((sum, r) => sum + r.rating, 0) / project.reviews.length).toFixed(1)
    : '0.0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShowReviewModal(false)}
    >
      <div
        className="w-[600px] max-h-[80vh] wood-bg brass-border rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-theater-wood-light">
          <div>
            <h3 className="font-display text-xl font-bold text-theater-brass-light">
              观众评价
            </h3>
            <p className="text-xs text-theater-parchment/50 mt-0.5">
              {project.reviews.length} 条评价 · 平均 {avgRating} 星
            </p>
          </div>
          <button
            onClick={() => setShowReviewModal(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-theater-parchment/60 hover:text-theater-parchment hover:bg-theater-wood-light/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-theater-wood-light">
            <h4 className="text-sm text-theater-brass-light mb-3 font-medium">发表评价</h4>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-7 h-7 transition-colors',
                      (hoveredStar || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-theater-wood-light'
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-theater-parchment/60">
                {rating} 星
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写下你的观后感..."
              className="w-full h-20 bg-theater-dark/60 border border-theater-wood-light rounded-lg px-3 py-2 text-sm text-theater-parchment placeholder-theater-parchment/30 focus:border-theater-brass outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmit}
                disabled={!comment.trim()}
                className="brass-btn px-4 py-1.5 rounded-md text-sm disabled:opacity-50"
              >
                提交评价
              </button>
            </div>
          </div>

          {project.failureReplays.length > 0 && (
            <div className="p-4 border-b border-theater-wood-light">
              <h4 className="text-sm text-theater-brass-light mb-3 font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                失败回放 ({project.failureReplays.length})
              </h4>
              <div className="space-y-2">
                {project.failureReplays.map((replay) => (
                  <div
                    key={replay.id}
                    className="p-3 bg-theater-dark/40 rounded-lg border border-theater-wood-light flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm text-theater-parchment">{replay.reason}</div>
                      <div className="text-xs text-theater-parchment/50 mt-0.5">
                        {formatDate(replay.createdAt)} · {replay.recordedFrames.length} 帧
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFailureReplay(true, replay)}
                      className="brass-btn px-3 py-1.5 rounded-md text-xs flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      回放
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4">
            <h4 className="text-sm text-theater-brass-light mb-3 font-medium">
              历史评价
            </h4>
            {project.reviews.length === 0 ? (
              <div className="text-center py-8 text-theater-parchment/40">
                暂无评价，快来成为第一个观众吧！
              </div>
            ) : (
              <div className="space-y-3">
                {[...project.reviews].reverse().map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-theater-dark/40 rounded-lg border border-theater-wood-light"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-theater-wood-light'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-theater-parchment/40">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-theater-parchment/80 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
