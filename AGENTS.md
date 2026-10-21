<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared navigation and local store/UI providers around the root Outlet; every content view owns a distinct leaf route and metadata.
- Store personal app data only in the browser and call configurable Ollama directly from client actions; this preserves the requested local-first privacy model.
- Keep model prompts, schemas, provider calls, task logic, planner rules, and backup validation separate so domain behavior can be tested independently.
