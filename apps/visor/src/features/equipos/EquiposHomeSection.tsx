import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { useOrgStructure, useOrgUsers } from "./api";
import type { OrgTeam, OrgArea } from "./api";

export default function EquiposHomeSection({ darkMode }: { darkMode: boolean }) {
  const navigate = useNavigate();
  const { data: org, isLoading } = useOrgStructure();
  const { data: users = [] } = useOrgUsers();

  const areas: OrgArea[] = org?.areas ?? [];
  const teams: OrgTeam[] = org?.teams ?? [];

  return (
    <section className={`rounded-[5px] border-[3px] ${darkMode ? "bg-[#1c1a18] border-[#3e382f]" : "bg-white border-[#dfd9cc] shadow-[4px_4px_0px_#dfd9cc]"}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b-[3px] border-[#dfd9cc] dark:border-[#3e382f]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-4 h-4 ${darkMode ? "text-[#d4a373]" : "text-[#b57b54]"}`} />
          <h2 className={`text-sm font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Equipos
          </h2>
        </div>
        <button
          onClick={() => navigate("/equipos")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black text-[#b57b54] hover:bg-[#faedcd]/40 dark:hover:bg-[#3e342a]/40 cursor-pointer"
        >
          Gestionar equipos <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {isLoading && (
          <div className="h-20 w-full rounded animate-pulse bg-stone-200 dark:bg-[#24211e]" />
        )}

        {!isLoading && areas.length === 0 && (
          <p className={`text-[11px] font-black uppercase tracking-widest opacity-40 ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
            No hay equipos configurados todavía
          </p>
        )}

        {!isLoading && areas.map((area) => {
          const areaTeams = teams.filter((t) => t.areaId === area.id);
          return (
            <div key={area.id}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className={`w-3.5 h-3.5 ${darkMode ? "text-stone-500" : "text-stone-400"}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
                  {area.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {areaTeams.length === 0 ? (
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? "text-stone-600" : "text-stone-400"}`}>
                    Sin equipos todavía
                  </span>
                ) : areaTeams.map((team) => {
                  const members = users.filter((u) => u.teamId === team.id);
                  return (
                    <div
                      key={team.id}
                      className={`inline-flex flex-col gap-1 rounded-[5px] border px-3 py-2.5 min-w-[180px] ${darkMode ? "bg-[#161412] border-[#3e382f]" : "bg-[#fcfbf9] border-[#e6e0d0]"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-xs font-black ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
                          {team.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-stone-500">
                          <UsersIcon className="w-3 h-3" /> {members.length}
                        </span>
                      </div>
                      <span className={`text-[9px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
                        Coord: {team.coordinatorName || "—"} · Sup: {team.supervisorName || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
