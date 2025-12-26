"use client";

import { useEffect, useRef, useState } from "react";

/**
 * @file CustomCursor.tsx
 * @description 마우스를 따라다니는 커스텀 커서 캐릭터 컴포넌트
 *
 * 주요 기능:
 * 1. 마우스 포인터 좌측 하단에 캐릭터 배치
 * 2. Lerp(Linear Interpolation)를 통한 부드러운 추적
 * 3. 걷는 듯한 절차적 애니메이션 (Bobbing, Tilting)
 * 4. 이동 방향에 따른 캐릭터 방향 전환
 * 5. 터치/모바일 디바이스에서는 자동 비활성화
 */

// 캐릭터 위치 오프셋 (마우스 포인터 기준 좌측 하단)
const CURSOR_OFFSET_X = -10; // 좌측으로 이동
const CURSOR_OFFSET_Y = 30;  // 하단으로 이동
const LERP_FACTOR = 0.15;    // 추적 부드러움 정도 (낮을수록 느림)

/**
 * 터치 디바이스 감지 함수
 * - 터치 이벤트 지원 여부
 * - 포인터 타입 확인 (coarse = 터치, fine = 마우스)
 * - 최대 터치 포인트 확인
 */
function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    // 터치 이벤트 지원 확인
    const hasTouchEvent = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 포인터 타입 확인 (fine = 정밀한 포인터 = 마우스)
    const hasFinePonter = window.matchMedia('(pointer: fine)').matches;
    
    // 호버 지원 확인 (터치 디바이스는 호버 불가)
    const canHover = window.matchMedia('(hover: hover)').matches;
    
    // 터치 이벤트가 있고, 정밀한 포인터가 없거나 호버가 안되면 터치 디바이스
    return hasTouchEvent && (!hasFinePonter || !canHover);
}

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchMode, setIsTouchMode] = useState(false);

    // Use refs for values to avoid re-renders during animation loop
    const mousePos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const frameId = useRef<number>(0);
    const lastTime = useRef<number>(0);
    const walkCycle = useRef<number>(0);
    const lastScaleX = useRef<number>(1); // 이전 방향 유지용

    // 터치 디바이스 감지 및 터치 이벤트 발생 시 커서 숨기기
    useEffect(() => {
        // 초기 터치 디바이스 감지
        if (isTouchDevice()) {
            setIsTouchMode(true);
            return;
        }

        // 터치 이벤트 발생 시 커서 숨기기 (하이브리드 디바이스 대응)
        const onTouchStart = () => {
            setIsTouchMode(true);
            setIsVisible(false);
        };

        // 마우스 이벤트 발생 시 다시 활성화 (하이브리드 디바이스에서 마우스 연결 시)
        const onMouseEnter = () => {
            // 마우스 이벤트가 터치에서 에뮬레이션된 것이 아닌지 확인
            if (!isTouchDevice()) {
                setIsTouchMode(false);
            }
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('mouseenter', onMouseEnter);

        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('mouseenter', onMouseEnter);
        };
    }, []);

    useEffect(() => {
        // 터치 모드에서는 커서 비활성화
        if (isTouchMode) return;

        // Show cursor when interaction starts
        const onMouseMove = (e: MouseEvent) => {
            // 터치에서 에뮬레이션된 마우스 이벤트 무시
            // sourceCapabilities가 있고 firesTouchEvents가 true이면 터치에서 발생한 이벤트
            const sourceCapabilities = (e as MouseEvent & { sourceCapabilities?: { firesTouchEvents?: boolean } }).sourceCapabilities;
            if (sourceCapabilities?.firesTouchEvents) {
                return;
            }

            const newPos = { x: e.clientX, y: e.clientY };
            mousePos.current = newPos;

            // 첫 등장 시 마우스 위치로 즉시 이동 (어색한 날아오기 방지)
            if (!isVisible) {
                currentPos.current = { ...newPos };
                setIsVisible(true);
            }
        };

        window.addEventListener("mousemove", onMouseMove);

        // Animation loop
        const animate = (time: number) => {
            if (!lastTime.current) lastTime.current = time;
            const content = cursorRef.current;

            if (content) {
                // Smooth follow logic (Linear Interpolation)
                const dx = mousePos.current.x - currentPos.current.x;
                const dy = mousePos.current.y - currentPos.current.y;

                currentPos.current.x += dx * LERP_FACTOR;
                currentPos.current.y += dy * LERP_FACTOR;

                // Calculate velocity for walking animation
                const velocity = Math.sqrt(dx * dx + dy * dy);
                const isMoving = velocity > 0.5;

                // Walking/Bobbing Animation
                let bobOffset = 0;
                let rotation = 0;
                let scaleX = lastScaleX.current;

                if (isMoving) {
                    // Increment walk cycle based on velocity (with modulo to prevent overflow)
                    walkCycle.current = (walkCycle.current + velocity * 0.2) % (Math.PI * 20);

                    // Bobbing effect (up and down)
                    bobOffset = Math.sin(walkCycle.current * 0.2) * 4;
                    // Tilt effect (rotate based on movement direction)
                    rotation = Math.sin(walkCycle.current * 0.15) * 5;

                    // Flip based on direction (maintain previous if nearly stationary)
                    if (dx < -1) {
                        scaleX = -1;
                        lastScaleX.current = -1;
                    } else if (dx > 1) {
                        scaleX = 1;
                        lastScaleX.current = 1;
                    }
                    // else: scaleX remains as lastScaleX.current
                }

                // 좌측 하단 오프셋 적용
                const finalX = currentPos.current.x + CURSOR_OFFSET_X;
                const finalY = currentPos.current.y + CURSOR_OFFSET_Y + bobOffset;

                // Apply transforms
                content.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${rotation}deg) scaleX(${scaleX})`;
            }

            lastTime.current = time;
            frameId.current = requestAnimationFrame(animate);
        };

        frameId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(frameId.current);
        };
    }, [isVisible, isTouchMode]);

    // 터치 모드이거나 보이지 않으면 렌더링하지 않음
    if (isTouchMode || !isVisible) return null;

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.2s ease-out'
            }}
        >
            <img
                src="/KakaoTalk_20251224_134851796-removebg-preview.png"
                alt="Custom Cursor"
                className="w-32 h-auto drop-shadow-lg"
            />
        </div>
    );
}
