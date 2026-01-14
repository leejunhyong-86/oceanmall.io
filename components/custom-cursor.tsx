"use client";

import { useEffect, useRef, useState } from "react";

/**
 * @file CustomCursor.tsx
 * @description 留덉슦?ㅻ? ?곕씪?ㅻ땲??而ㅼ뒪? 而ㅼ꽌 罹먮┃??而댄룷?뚰듃
 *
 * 二쇱슂 湲곕뒫:
 * 1. 留덉슦???ъ씤??醫뚯륫 ?섎떒??罹먮┃??諛곗튂
 * 2. Lerp(Linear Interpolation)瑜??듯븳 遺?쒕윭??異붿쟻
 * 3. 嫄룸뒗 ??븳 ?덉감???좊땲硫붿씠??(Bobbing, Tilting)
 * 4. ?대룞 諛⑺뼢???곕Ⅸ 罹먮┃??諛⑺뼢 ?꾪솚
 * 5. ?곗튂/紐⑤컮???붾컮?댁뒪?먯꽌???먮룞 鍮꾪솢?깊솕
 */

// 罹먮┃???꾩튂 ?ㅽ봽??(留덉슦???ъ씤??湲곗? 醫뚯륫 ?섎떒)
const CURSOR_OFFSET_X = -10; // 醫뚯륫?쇰줈 ?대룞
const CURSOR_OFFSET_Y = 30;  // ?섎떒?쇰줈 ?대룞
const LERP_FACTOR = 0.15;    // 異붿쟻 遺?쒕윭? ?뺣룄 (??쓣?섎줉 ?먮┝)

/**
 * ?곗튂 ?붾컮?댁뒪 媛먯? ?⑥닔
 * - ?곗튂 ?대깽??吏???щ?
 * - ?ъ씤??????뺤씤 (coarse = ?곗튂, fine = 留덉슦??
 * - 理쒕? ?곗튂 ?ъ씤???뺤씤
 */
function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    // ?곗튂 ?대깽??吏???뺤씤
    const hasTouchEvent = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // ?ъ씤??????뺤씤 (fine = ?뺣????ъ씤??= 留덉슦??
    const hasFinePonter = window.matchMedia('(pointer: fine)').matches;
    
    // ?몃쾭 吏???뺤씤 (?곗튂 ?붾컮?댁뒪???몃쾭 遺덇?)
    const canHover = window.matchMedia('(hover: hover)').matches;
    
    // ?곗튂 ?대깽?멸? ?덇퀬, ?뺣????ъ씤?곌? ?녾굅???몃쾭媛 ?덈릺硫??곗튂 ?붾컮?댁뒪
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
    const lastScaleX = useRef<number>(1); // ?댁쟾 諛⑺뼢 ?좎???

    // ?곗튂 ?붾컮?댁뒪 媛먯? 諛??곗튂 ?대깽??諛쒖깮 ??而ㅼ꽌 ?④린湲?
    useEffect(() => {
        // 珥덇린 ?곗튂 ?붾컮?댁뒪 媛먯?
        if (isTouchDevice()) {
            setIsTouchMode(true);
            return;
        }

        // ?곗튂 ?대깽??諛쒖깮 ??而ㅼ꽌 ?④린湲?(?섏씠釉뚮━???붾컮?댁뒪 ???
        const onTouchStart = () => {
            setIsTouchMode(true);
            setIsVisible(false);
        };

        // 留덉슦???대깽??諛쒖깮 ???ㅼ떆 ?쒖꽦??(?섏씠釉뚮━???붾컮?댁뒪?먯꽌 留덉슦???곌껐 ??
        const onMouseEnter = () => {
            // 留덉슦???대깽?멸? ?곗튂?먯꽌 ?먮??덉씠?섎맂 寃껋씠 ?꾨땶吏 ?뺤씤
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
        // ?곗튂 紐⑤뱶?먯꽌??而ㅼ꽌 鍮꾪솢?깊솕
        if (isTouchMode) return;

        // Show cursor when interaction starts
        const onMouseMove = (e: MouseEvent) => {
            // ?곗튂?먯꽌 ?먮??덉씠?섎맂 留덉슦???대깽??臾댁떆
            // sourceCapabilities媛 ?덇퀬 firesTouchEvents媛 true?대㈃ ?곗튂?먯꽌 諛쒖깮???대깽??
            const sourceCapabilities = (e as MouseEvent & { sourceCapabilities?: { firesTouchEvents?: boolean } }).sourceCapabilities;
            if (sourceCapabilities?.firesTouchEvents) {
                return;
            }

            const newPos = { x: e.clientX, y: e.clientY };
            mousePos.current = newPos;

            // 泥??깆옣 ??留덉슦???꾩튂濡?利됱떆 ?대룞 (?댁깋???좎븘?ㅺ린 諛⑹?)
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

                // 醫뚯륫 ?섎떒 ?ㅽ봽???곸슜
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

    // ?곗튂 紐⑤뱶?닿굅??蹂댁씠吏 ?딆쑝硫??뚮뜑留곹븯吏 ?딆쓬
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
                className="w-16 h-auto drop-shadow-lg"
            />
        </div>
    );
}

