import * as S from "./screept-lang";

export const exampleEnv: S.Environment = {
  output: [],
  procedures: {
    farm_till: S.parseStatement(
      `{turn_count = 10; RUN turn(); $["farm_plot_tilled_"+farm_plot] = 1}`
    ),
    farm_upgrade: S.parseStatement(
      "{\n money = (money - farm_upgrade_cost());\n farm_level = (farm_level + 1)\n}"
    ),
    test: S.parseStatement("{\n RND $[b] 1 6\n}"),
    turn: S.parseStatement(
      "{\n turn = (turn + 1);\n turns_count = (turns_count - 1);\n minutes = ((turn - (turn // turns_per_hour * turns_per_hour )) * (60 // turns_per_hour));\n hour = (mod((turn // turns_per_hour) , 24));\n day = (turn // (turns_per_hour * 24));\n IF (turns_count > 0) THEN\n  RUN turn()\n ELSE   {\n   turns_count = 5\n  }\n}"
    ),
  },
  vars: {
    var: S.n(3),
    fn1: {
      type: "func",
      value: S.add(
        { type: "var", identifier: { type: "literal", value: "_0" } },
        { type: "var", identifier: { type: "literal", value: "_1" } }
      ),
    },
    status: S.fn(
      `"SS Turn: "+turn+" Time: "+hour+":"+minutes+", Gold: "+money`
    ),
    _enemy_name: S.t("s"),
    farm_level: S.n(1),
    farm_plot_planted_1: S.n(0),
    farm_plot_planted_2: S.n(0),
    farm_plot_stage_1: S.n(0),
    farm_plot_stage_2: S.n(0),
    farm_plot_tilled_1: S.n(0),
    farm_plot_tilled_2: S.n(0),
    farm_upgrade_cost: S.fn("((farm_level + 1) * 50)"),
    hour: S.n(0),
    minutes: S.n(0),
    money: S.n(1000),
    player_name: S.t("Liana"),
    player_profession: S.t("wayfarer"),
    test_func: S.fn("(turn + turns_per_hour)"),
    turn: S.n(1),
    turns_count: S.n(3),
    turns_per_hour: S.n(2),
    farm_plot: S.n(1),
  },
};

export const exampleScreept = `{ 
      PRINT "LAST ONE";
      a = 3 + 10 * 2;
      b = 0;
      f = FUNC _1 + 2 ;
      h = FUNC 666;
      g = FUNC _0 * (1-_1) ? 3+ (4 *2) : 1000;
      d = f(4,5);
      e = f("Jan","Alex");
      a0 = "Computed";
      IF !b THEN {
          PRINT "worked";
          IF !d THEN {PRINT e; PRINT !0} 
      } ELSE {
        PRINT "It didn't!"
      };
      PRINT h();
      PRINT f(2,f(f(4,5),3));
      PRINT g(2,1);
      PROC initjan {
        PRINT "Inside PROC";
        a = "Jan";
        PRINT a + " - " + b + e 
      };
      RUN initjan();
      PRINT a;
      RND r 10 100;
      PRINT "Random";
      PRINT r;
      PRINT $["a"+b];
      PRINT -120 // 50;
      mod = FUNC _0 -  (_0 // _1 * _1) ;
      and = FUNC _0 * _1 > 0;
      or =  FUNC _0 ? 1 : !!_1;
      PRINT mod(12,3);
      PRINT ( 21 > 20 );
      PRINT and(20>20, 0);
      PRINT or(0,0);
      $[a] = 12;
      PRINT status();
      RUN turn();
      RUN turn();
      RUN turn();
      RUN farm_upgrade();
      RUN test();
      PRINT status();
      RUN farm_till();
      PRINT status();
  }`;
