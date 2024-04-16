let template: string = '<div style="margin: 40px; padding: 20px; background: white; text-align: justify; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14px; color: #002d93;">' +
    '    <div class="logo" style="margin-bottom: 40px; text-align: left; max-width: 150px;"><img style="width: 100%;" src="%%VAR%%base_url%%%%VAR%%logo_url%%"></div>' +
    '    <div style="margin-bottom:20px;">' +
    '        <div>' +
    '            <span style="margin-right: 5px;font-weight: 700">Utilisateur : </span>' +
    '            <span>%%VAR%%user_name%%</span>' +
    '        </div>' +
    '    </div>' +
    '    <div style="margin-bottom: 10px; border: 1px solid #002d93; padding: 8px; font-weight: bold; text-align: center;">' +
    '    %%VAR%%date%% - %%VAR%%name%%' +
    '    </div>' +
    '    §§IFVAR_points_cles<div><label>Points clés</label>%%VAR%%points_cles%%</div>§§§§' +
    '    §§IFVAR_objectif_prochaine_visite<div><label>Objectif de la prochaine visite</label>%%VAR%%objectif_prochaine_visite%%</div>§§§§' +
    '</div>';
export default template;