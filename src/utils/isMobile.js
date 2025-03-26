
export const useIsMobile = () => {
    const isMobile = window.innerWidth < 768;
    return {isMobile};
}
