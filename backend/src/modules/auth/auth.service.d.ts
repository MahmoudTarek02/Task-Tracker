declare class AuthService {
    register(name: string, email: string, password: string): Promise<{
        id: any;
        name: any;
        email: any;
    }>;
    verifyEmail(token: string): Promise<{
        id: any;
        name: any;
        email: any;
        isEmailVerified: any;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
        };
        token: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map