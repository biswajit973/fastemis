import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import {
    AgentAgreementQuestion,
    AgreementAnswerChoice,
    AgreementQuestionItem,
    UserAgreementState
} from '../models/agreement.model';

@Injectable({
    providedIn: 'root'
})
export class AgreementApiService {
    constructor(private http: HttpClient) { }

    getAgentQuestions(): Observable<AgentAgreementQuestion[]> {
        return this.http.get<{ questions?: Array<{
            questionId: number;
            description: string;
            answerType: 'yes_no';
            is_active: boolean;
            updated_at: string;
        }> }>('/api/agent/agreements/questions').pipe(
            map((response) => response?.questions || []),
            catchError(() => of([]))
        );
    }

    saveAgentQuestions(questions: Array<{ questionId: number; description: string }>): Observable<AgentAgreementQuestion[]> {
        return this.http.post<{ questions?: Array<{
            questionId: number;
            description: string;
            answerType: 'yes_no';
            is_active: boolean;
            updated_at: string;
        }> }>('/api/agent/agreements/questions', { questions }).pipe(
            map((response) => response?.questions || []),
            catchError(() => of([]))
        );
    }

    resetUserAgreements(userId: string): Observable<boolean> {
        return this.http.post('/api/agent/agreements/reset-user', { user_id: userId }).pipe(
            map(() => true),
            catchError(() => of(false))
        );
    }

    setUserAgreementVisibility(userId: string, enabled: boolean): Observable<boolean> {
        return this.http.patch<{ agreement_tab_enabled?: boolean }>('/api/agent/agreements/user-visibility', {
            user_id: userId,
            agreement_tab_enabled: enabled
        }).pipe(
            map((response) => !!response && !!response.agreement_tab_enabled === enabled),
            catchError(() => of(false))
        );
    }

    getUserAgreementState(): Observable<UserAgreementState> {
        return this.http.get<{
            questions?: AgreementQuestionItem[];
            all_answered?: boolean;
            total_questions?: number;
            agreement_enabled?: boolean;
            agreement_complete?: boolean;
            signature_url?: string;
            consent_video_url?: string;
            agreement_completed_at?: string | null;
        }>('/api/agreements/questions').pipe(
            map((response) => ({
                questions: (response?.questions || []).map((item) => ({
                    questionId: Number(item.questionId),
                    description: String(item.description || ''),
                    answerType: 'yes_no' as const,
                    answer: item.answer === 'yes' || item.answer === 'no' ? item.answer : null,
                    readonly: !!item.readonly
                })),
                allAnswered: !!response?.all_answered,
                totalQuestions: Number(response?.total_questions || 0),
                agreementEnabled: !!response?.agreement_enabled,
                agreementComplete: !!response?.agreement_complete,
                signatureUrl: String(response?.signature_url || ''),
                consentVideoUrl: String(response?.consent_video_url || ''),
                agreementCompletedAt: response?.agreement_completed_at || null
            })),
            catchError(() => of({
                questions: [],
                allAnswered: false,
                totalQuestions: 0,
                agreementEnabled: false,
                agreementComplete: false,
                signatureUrl: '',
                consentVideoUrl: '',
                agreementCompletedAt: null
            }))
        );
    }

    submitUserAnswers(answers: Array<{ questionId: number; answer: AgreementAnswerChoice }>): Observable<UserAgreementState> {
        return this.http.post<{
            questions?: AgreementQuestionItem[];
            all_answered?: boolean;
            total_questions?: number;
            agreement_enabled?: boolean;
            agreement_complete?: boolean;
            signature_url?: string;
            consent_video_url?: string;
            agreement_completed_at?: string | null;
        }>('/api/agreements/answers', { answers }).pipe(
            map((response) => ({
                questions: (response?.questions || []).map((item) => ({
                    questionId: Number(item.questionId),
                    description: String(item.description || ''),
                    answerType: 'yes_no' as const,
                    answer: item.answer === 'yes' || item.answer === 'no' ? item.answer : null,
                    readonly: !!item.readonly
                })),
                allAnswered: !!response?.all_answered,
                totalQuestions: Number(response?.total_questions || 0),
                agreementEnabled: !!response?.agreement_enabled,
                agreementComplete: !!response?.agreement_complete,
                signatureUrl: String(response?.signature_url || ''),
                consentVideoUrl: String(response?.consent_video_url || ''),
                agreementCompletedAt: response?.agreement_completed_at || null
            })),
            catchError(() => of({
                questions: [],
                allAnswered: false,
                totalQuestions: 0,
                agreementEnabled: false,
                agreementComplete: false,
                signatureUrl: '',
                consentVideoUrl: '',
                agreementCompletedAt: null
            }))
        );
    }

    completeAgreement(payload: FormData): Observable<UserAgreementState | null> {
        return this.http.post<{
            questions?: AgreementQuestionItem[];
            all_answered?: boolean;
            total_questions?: number;
            agreement_enabled?: boolean;
            agreement_complete?: boolean;
            signature_url?: string;
            consent_video_url?: string;
            agreement_completed_at?: string | null;
        }>('/api/agreements/complete', payload).pipe(
            map((response) => ({
                questions: (response?.questions || []).map((item) => ({
                    questionId: Number(item.questionId),
                    description: String(item.description || ''),
                    answerType: 'yes_no' as const,
                    answer: item.answer === 'yes' || item.answer === 'no' ? item.answer : null,
                    readonly: !!item.readonly
                })),
                allAnswered: !!response?.all_answered,
                totalQuestions: Number(response?.total_questions || 0),
                agreementEnabled: !!response?.agreement_enabled,
                agreementComplete: !!response?.agreement_complete,
                signatureUrl: String(response?.signature_url || ''),
                consentVideoUrl: String(response?.consent_video_url || ''),
                agreementCompletedAt: response?.agreement_completed_at || null
            })),
            catchError(() => of(null))
        );
    }
}
