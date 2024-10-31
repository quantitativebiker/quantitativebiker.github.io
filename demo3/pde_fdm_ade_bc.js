step_bc_ade_eval = function () {
    // 1 time step of the Barakat and Clark, Towler and Yang (BCTY) scheme

    t = demo.t;
    dx = (demo.xright - demo.xleft) / (demo.NX-1);
    dx2 = dx * dx;

    alpha = eval(demo.u_left_alpha);
    beta  = eval(demo.u_left_beta);
    gamma = eval(demo.u_left_gamma);
    epsilon = eval(demo.u_left_epsilon);

    i = 0;
    x = demo.xleft + (i / (demo.NX - 1)) * (demo.xright - demo.xleft);
    A = eval(demo.A);
    B = eval(demo.B);
    C = eval(demo.C);
    D = eval(demo.D);

    A0 = - A / dx2 + B / (2.0 * dx);
    B0 =  1.0 / dt + A / dx2  - C;
    Y0 = U[0] / dt + A * (U[1] - U[0])  / dx2 + D + B / (2.0 * dx) * U[1];

    i = 1;
    x = demo.xleft + (i / (demo.NX - 1)) * (demo.xright - demo.xleft);
    A = eval(demo.A);
    B = eval(demo.B);
    C = eval(demo.C);
    D = eval(demo.D);
    
    A1 = - A / dx2 + B / (2.0 * dx);
    B1 =  1.0 / dt + A / dx2  - C;
    Y1 = U[1] / dt + A * (U[2] - U[1])  / dx2 + D + B / (2.0 * dx) * U[2];

    um  = ( epsilon - ( -(A1*Y0*beta)/(2.0*B0*B1) + (Y1*beta)/(2.0*B1) ) / dx
        - ( -(A1*Y0*gamma)/(B0*B1) + (Y1*gamma)/B1 - (2.0*Y0*gamma)/B0 ) / dx2 - (Y0*alpha) / B0 );
    um /= ( (A0*A1*beta)/(2.0*B0*B1*dx) + (A0*A1*gamma)/(B0*B1*dx2) -A0*alpha/B0 
        + (2.0*A0*gamma)/(B0*dx2) - beta/(2.0*dx) + gamma/dx2 );

    U_next[0] = (Y0 - A0 * um) / B0;
    U_next[1] = (Y1 - A1 * U_next[0]) / B1;

    alpha = eval(demo.u_right_alpha);
    beta  = eval(demo.u_right_beta);
    gamma = eval(demo.u_right_gamma);
    epsilon = eval(demo.u_right_epsilon); 

    i = 0;
    j = demo.NX-1 -i ;

    x = demo.xleft + (j / (demo.NX - 1)) * (demo.xright - demo.xleft);
    A = eval(demo.A);
    B = eval(demo.B);
    C = eval(demo.C);
    D = eval(demo.D);

    CN = - A / dx2 - B / (2.0 * dx);
    BN =  1.0 / dt + A / dx2  - C;
    YN = V[j] / dt - A * (V[j] - V[j-1])  / dx2 + D - B / (2.0 * dx) * V[j-1] ;

    i = 1;
    j = demo.NX-1 -i ;

    x = demo.xleft + (j / (demo.NX - 1)) * (demo.xright - demo.xleft);
    A = eval(demo.A);
    B = eval(demo.B);
    C = eval(demo.C);
    D = eval(demo.D);

    CNm = - A / dx2 - B / (2.0 * dx);
    BNm =  1.0 / dt + A / dx2  - C;
    YNm = V[j] / dt - A * (V[j] - V[j-1])  / dx2 + D - B / (2.0 * dx) * V[j-1];

    up =  ( epsilon - beta  * (-YNm  + (CNm * YN) / BN ) / (2.0 * BNm * dx)
        - gamma * ( -(2.0 * YN) / BN + YNm / BNm - (CNm * YN) / ( BNm * BN ) ) / dx2 - alpha * YN / BN );
    up /= ( beta / (2.0 * dx) - (CNm * CN * beta) / (2.0 * BNm * BN * dx)
        + gamma / dx2  + (2.0 * CN * gamma) / (BN * dx2) + (CNm * CN * gamma) / (BNm * BN * dx2) - alpha * CN  / BN );

    V_next[demo.NX-1] = (YN - CN * up) / BN;
    V_next[demo.NX-2] = (YNm - CNm * V_next[demo.NX-1]) / BNm;

    V_next[0] = U_next[0];                   // so that V[0] exists properly in the next time-step, alternatively have it = u[0] which will be this anyway
    U_next[demo.NX-1] = V_next[demo.NX-1];   // ditto for other side.

    for (i=2; i<demo.NX-1; ++i) {
        x = demo.xleft + (i / (demo.NX - 1)) * (demo.xright - demo.xleft);
        A = eval(demo.A);
        B = eval(demo.B);
        C = eval(demo.C);
        D = eval(demo.D);

        alpha  =          - A / dx2 + B / (2.0 * dx);
        beta_U = 1.0 / dt + A / dx2  - C;

        RHS_U = U[i] / dt + A * (U[i+1] - U[i])  / dx2 + D + B / (2.0 * dx) * U[i+1];
        U_next[i] = ( -alpha * U_next[i-1] + RHS_U ) / beta_U;

        j = demo.NX-1 -i;
        x = demo.xleft + (j / (demo.NX - 1)) * (demo.xright - demo.xleft);
        A = eval(demo.A);
        B = eval(demo.B);
        C = eval(demo.C);
        D = eval(demo.D);

        beta_V = 1.0 / dt + A / dx2  - C;
        gamma  =          - A / dx2 - B / (2.0 * dx); 

        RHS_V = V[j] / dt - A * (V[j] - V[j-1])  / dx2 + D - B / (2.0 * dx) * V[j-1];
        V_next[j] = ( -gamma * V_next[j+1] + RHS_V ) / beta_V;
    }

    u[0] = U_next[0];
    for (i=1; i<demo.NX-1; ++i) {
        u[i] = 0.5 * ( U_next[i] + V_next[i] );
    }
    u[demo.NX-1] = V_next[demo.NX-1];

    theta = eval(demo.ade_resetting);
    for (i=0; i<demo.NX; ++i) {
        U[i] = u[i] * theta + (1.0 - theta) * U_next[i];
        V[i] = u[i] * theta + (1.0 - theta) * V_next[i];
    }
};
