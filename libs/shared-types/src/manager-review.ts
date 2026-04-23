import type { ManagerReviewStatus } from './enums';

export interface ManagerReview {
  id: string;
  planId: string;
  reviewerId: string;
  reviewerDisplayName: string;
  reviewedAt: string;
  status: ManagerReviewStatus;
  summaryNote: string | null;
}

export interface SubmitReviewRequest {
  status: ManagerReviewStatus;
  summaryNote?: string;
}
