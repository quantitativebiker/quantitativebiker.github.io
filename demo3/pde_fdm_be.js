step_be_soln_eval = function () {
    // 1 time step of Backward Time Central Space (BTCS) scheme
    // solved using an augmented Thomas algorithm to allow
    // for more general boundary conditions
    // division by only likely 0 if problem is degenerate in which case restart

    t = demo.t;
    dx = (demo.xright - demo.xleft) / (demo.NX-1);
    dx2 = dx * dx;

    alpha   = eval(demo.u_left_alpha);
    beta    = eval(demo.u_left_beta);
    gamma   = eval(demo.u_left_gamma);
    epsilon = eval(demo.u_left_epsilon);

    Bm = (- beta / (2.0 * dx) + gamma / dx2 );
    Cm = ( alpha - 2.0 * gamma / dx2);
    Dm = (  beta / (2.0 * dx) + gamma / dx2);
    Ym = epsilon;

    eps = 1e-10;
    if (Math.abs(Bm) < eps) { // probably pure Dirichlet conditions, will just use if-branch here for this 
        thomas_c[0] = 0;
        thomas_y[0] = epsilon;
    } else {
        i = 0;
        x = demo.xleft;
        A = eval(demo.A);
        B = eval(demo.B);
        C = eval(demo.C);
        D = eval(demo.D);

        a0 = - A / dx2 + B / (2.0 * dx);
        b0 = 1.0 / dt + 2.0 * A / dx2 - C - a0 * Cm / Bm;
        thomas_y[0] = (u_be[0] / dt + D - a0 * epsilon / Bm ) / b0;
        thomas_c[0] = (- A / dx2 - B / (2.0 * dx) - a0 * Dm / Bm) / b0;
    }

    for (i=1; i<demo.NX - 0; ++i) {
        x = demo.xleft + (i / (demo.NX - 1)) * (demo.xright - demo.xleft);
        A = eval(demo.A);
        B = eval(demo.B);
        C = eval(demo.C);
        D = eval(demo.D);

        a =                - A / dx2 + B / (2.0*dx); 
        b = 1.0 / dt + 2.0 * A / dx2 - C; 
        c =                - A / dx2 - B / (2.0*dx);

        y = u_be[i] / dt + D;
        denom   = (b - a * thomas_c[i-1] );
        thomas_c[i] = c / denom;
        thomas_y[i] = (y - a * thomas_y[i-1]) / denom;
    }

    i = (demo.NX - 1);
    x = demo.xleft + (i / (demo.NX - 1)) * (demo.xright - demo.xleft);

    alpha   = eval(demo.u_right_alpha);
    beta    = eval(demo.u_right_beta);
    gamma   = eval(demo.u_right_gamma);
    epsilon = eval(demo.u_right_epsilon);

    DNp = (- beta / (2.0 * dx) + gamma / dx2);
    ANp = ( alpha        - 2.0 * gamma / dx2);
    BNp = (  beta / (2.0 * dx) + gamma / dx2);
    YNp = epsilon;

    u_Np  = YNp - DNp * thomas_y[i-1] - (ANp - DNp * thomas_c[i-1]) * thomas_y[i];
    u_Np /= BNp - (ANp - DNp * thomas_c[i-1]) * thomas_c[i];

    u_be[demo.NX - 1] = thomas_y[i] - thomas_c[i] * u_Np;

    for (i=demo.NX - 2; i != -1; --i) {
        u_be[i] = thomas_y[i] - thomas_c[i] * u_be[i+1];
    }
}
