export type AgreementAnswerChoice = 'yes' | 'no';

export interface AgreementQuestionItem {
    questionId: number;
    description: string;
    answerType: 'yes_no';
    answer: AgreementAnswerChoice | null;
    readonly: boolean;
}

export interface AgentAgreementQuestion {
    questionId: number;
    description: string;
    answerType: 'yes_no';
    is_active: boolean;
    updated_at: string;
}

export interface UserAgreementState {
    questions: AgreementQuestionItem[];
    allAnswered: boolean;
    totalQuestions: number;
    agreementEnabled: boolean;
    agreementComplete: boolean;
    signatureUrl: string;
    consentVideoUrl: string;
    agreementCompletedAt: string | null;
}
